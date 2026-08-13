import { Router } from "express";
import { authRouter } from "./auth-routes";
import { submissionRouter } from "./submission-routes";
import { questionRouter } from "./question-routes";

export const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/submission", submissionRouter);
appRouter.use("/questions", questionRouter);

