import { Router } from "express";
import { auth } from "../middleware/auth";
import { submissionRateLimiter } from "../middleware/rate-limiter";
import {
  getSubmissionById,
  getSubmissions,
  runCode,
  submitCode,
} from "../controllers/submission-controller";

export const submissionRouter = Router();

submissionRouter.post("/run", auth, submissionRateLimiter, runCode);
submissionRouter.post("/submit", auth, submissionRateLimiter, submitCode);
submissionRouter.get("/submissions", auth, getSubmissions);
submissionRouter.get("/:id", auth, getSubmissionById);

