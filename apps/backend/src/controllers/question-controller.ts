import type { Request, Response } from "express";
import { prisma } from "@repo/db";

export const getQuestions = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const difficulty = req.query.difficulty as "Easy" | "Medium" | "Hard" | undefined;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;

    const where: any = {};
    if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
      where.difficulty = difficulty;
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          category: true,
          createdAt: true,
          _count: {
            select: {
              submissions: true,
              testCases: true,
            },
          },
        },
        orderBy: { id: "asc" },
        skip,
        take: limit,
      }),
      prisma.question.count({ where }),
    ]);

    res.status(200).json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getQuestions error:", err);
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
