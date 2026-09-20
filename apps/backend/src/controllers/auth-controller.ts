import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@repo/db";
import { z } from "zod";

export const signupSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password cannot exceed 100 characters"),
});

export const signinSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .trim()
    .min(1, "Username is required"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export const signup = async (req: Request, res: Response) => {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return res.status(400).json({
        message: firstError,
        errors: parseResult.error.issues,
      });
    }

    const { username, password } = parseResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
      const token = jwt.sign(
        {
          userId: newUser.id,
          username: newUser.username,
        },
        jwtSecret,
        {
          expiresIn: "7d",
        },
      );
      res.cookie("token", token, COOKIE_OPTIONS);
    }

    res.status(201).json({
      message: "User created successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const isProduction = process.env.NODE_ENV === "production";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

export const signin = async (req: Request, res: Response) => {
  try {
    const parseResult = signinSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input";
      return res.status(400).json({
        message: firstError,
        errors: parseResult.error.issues,
      });
    }

    const { username, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured in environment!");
      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("token", token, COOKIE_OPTIONS);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const signout = async (req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    path: "/",
  });
  return res.status(200).json({
    message: "Logged out successfully",
  });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

