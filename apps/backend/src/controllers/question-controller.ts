import type { Request, Response } from "express";
import { prisma } from "@repo/db";

export const getQuestions = async (_req: Request, res: Response) => {
  try {
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        _count: {
          select: {
            submissions: true,
            testCases: true,
          },
        },
      },
    });

    res.status(200).json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid question ID" });
    }

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        testCases: {
          where: { isSample: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({ question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
