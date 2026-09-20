import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import { getRedisClient } from "../lib/redis";

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

export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const submissions = await prisma.submission.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      submissions,
    });
  } catch (err) {
    console.error(err);
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

    if (
      customTestCases &&
      (!Array.isArray(customTestCases) || customTestCases.some((c: any) => typeof c !== "string"))
    ) {
      return res.status(400).json({
        message: "customTestCases must be an array of strings",
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

    // Await ephemeral run result from worker (15s timeout)
    const rawResult = await redis.brPop(`run_results:${runId}`, 15);
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

