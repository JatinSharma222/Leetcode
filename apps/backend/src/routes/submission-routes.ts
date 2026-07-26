import { Router } from "express";
import { auth } from "../middleware/auth";
import { getSubmissions, submitCode } from "../controllers/submission-controller";

export const submissionRouter = Router();

submissionRouter.post("/submit", auth, submitCode);
submissionRouter.get("/submissions", auth, getSubmissions);
