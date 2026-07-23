import type { Request, Response } from "express";
import { prisma } from "../db";

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
    });

    res.status(200).json({
      submissions,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const submitCode = async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;
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
      },
    });

    res.status(201).json({
      message: "Code submitted successfully",
      submission,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};


