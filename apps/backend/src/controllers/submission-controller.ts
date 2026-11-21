import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import { createDedicatedRedisClient, getRedisClient } from "../lib/redis";

export const getSubmissionById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Submission ID is required" });
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.status(200).json({ submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Server-Sent Events (SSE) endpoint providing live testcase-by-testcase
 * evaluation updates streamed to the frontend via Redis Pub/Sub.
 */
export const streamSubmissionProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Submission ID is required" });
    }

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        results: true,
      },
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (submission.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // If already finalized, push final state and close
    if (submission.status !== "Processing") {
      res.write(`data: ${JSON.stringify({ type: "completed", submission })}\n\n`);
      return res.end();
    }

    // Subscribe to live worker updates via Redis PubSub
    const subscriber = await createDedicatedRedisClient();
    const channel = `submission_events:${id}`;

    await subscriber.subscribe(channel, (message) => {
      res.write(`data: ${message}\n\n`);
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === "completed") {
          subscriber.unsubscribe(channel).catch(() => { });
          subscriber.disconnect().catch(() => { });
          res.end();
        }
      } catch { }
    });

    req.on("close", () => {
      subscriber.unsubscribe(channel).catch(() => { });
      subscriber.disconnect().catch(() => { });
    });
  } catch (err) {
    console.error("streamSubmissionProgress error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const questionId = typeof req.query.questionId === "string" ? req.query.questionId : undefined;
    const status = typeof req.query.status === "string" ? (req.query.status as any) : undefined;

    const where: any = { userId };
    if (questionId) where.questionId = questionId;
    if (status) where.status = status;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          question: {
            select: {
              id: true,
              title: true,
              difficulty: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ]);

    res.status(200).json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getSubmissions error:", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const submitCode = async (req: Request, res: Response) => {
  try {
    const { code, language, questionId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const ALLOWED_LANGUAGES = ["cpp", "javascript", "python"];

    if (
      !code ||
      typeof code !== "string" ||
      !language ||
      typeof language !== "string" ||
      !questionId ||
      typeof questionId !== "string"
    ) {
      return res.status(400).json({
        message: "code, language, and questionId are required strings",
      });
    }

    if (!ALLOWED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        message: `Unsupported language. Allowed: ${ALLOWED_LANGUAGES.join(", ")}`,
      });
    }

    if (code.length > 50000) {
      return res.status(400).json({
        message: "Code submission exceeds maximum size limit (50KB)",
      });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    const submission = await prisma.submission.create({
      data: {
        userId,
        code,
        language,
        questionId,
      },
    });

    try {
      const redis = await getRedisClient();
      await redis.lPush(
        "problems",
        JSON.stringify({
          submissionId: submission.id,
          userId,
          questionId,
          code,
          language,
        }),
      );
    } catch (queueErr) {
      console.error("Failed to push submission to Redis queue:", queueErr);

      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: "Failure",
          output: "System error: Failed to enqueue submission for evaluation.",
        },
      });

      return res.status(503).json({
        message: "Queue service unavailable. Submission failed.",
      });
    }

    res.status(201).json({
      message: "Code submitted successfully",
      status: submission.status,
      submissionId: submission.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const runCode = async (req: Request, res: Response) => {
  try {
    const { code, language, questionId, customTestCases } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const ALLOWED_LANGUAGES = ["cpp", "javascript", "python"];

    if (
      !code ||
      typeof code !== "string" ||
      !language ||
      typeof language !== "string" ||
      !questionId ||
      typeof questionId !== "string"
    ) {
      return res.status(400).json({
        message: "code, language, and questionId are required strings",
      });
    }

    if (!ALLOWED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        message: `Unsupported language. Allowed: ${ALLOWED_LANGUAGES.join(", ")}`,
      });
    }

    if (code.length > 50000) {
      return res.status(400).json({
        message: "Code submission exceeds maximum size limit (50KB)",
      });
    }

    if (customTestCases) {
      if (!Array.isArray(customTestCases) || customTestCases.some((c: any) => typeof c !== "string")) {
        return res.status(400).json({
          message: "customTestCases must be an array of strings",
        });
      }

      if (customTestCases.length > 10) {
        return res.status(400).json({
          message: "A maximum of 10 custom test cases can be submitted per run.",
        });
      }

      if (customTestCases.some((c: string) => c.length > 10000)) {
        return res.status(400).json({
          message: "Each custom test case cannot exceed 10,000 characters.",
        });
      }
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    const runId = crypto.randomUUID();
    const redis = await getRedisClient();

    try {
      await redis.lPush(
        "run_requests",
        JSON.stringify({
          runId,
          userId,
          questionId,
          code,
          language,
          customTestCases: customTestCases || [],
        }),
      );
    } catch (queueErr) {
      console.error("Failed to push to run_requests queue:", queueErr);
      return res.status(503).json({
        message: "Queue service unavailable. Code run failed.",
      });
    }

    // Await ephemeral run result from worker (15s timeout) on dedicated blocking client
    let rawResult = null;
    let blockingRedis = null;
    try {
      blockingRedis = await createDedicatedRedisClient();
      rawResult = await blockingRedis.brPop(`run_results:${runId}`, 15);
    } catch (brPopErr) {
      console.error("Error waiting for runner result on Redis:", brPopErr);
      return res.status(500).json({ message: "Failed to retrieve execution result" });
    } finally {
      if (blockingRedis && blockingRedis.isOpen) {
        try {
          await blockingRedis.disconnect();
        } catch { }
      }
    }

    if (!rawResult) {
      return res.status(408).json({
        message: "Execution timed out. Please try again.",
      });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(rawResult.element);
    } catch {
      return res.status(500).json({ message: "Malformed runner result" });
    }

    return res.status(200).json(parsedResult);
  } catch (err) {
    console.error("runCode error:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

