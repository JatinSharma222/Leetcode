import type { Request, Response } from "express";
import { prisma } from "@repo/db";
import { createClient } from "redis";

const client = createClient();
client.connect();

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

    const submission = await prisma.submission.create({
      data: {
        userId,
        code,
        language,
        questionId,
      },
    });

    client.LPUSH(
      "problems",
      JSON.stringify({
        submissionId: submission.id,
        userId,
        questionId,
        code,
        language,
      }),
    );

    res.status(201).json({
      message: "Code submitted successfully",
      status: submission.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
