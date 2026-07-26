import { Router } from "express";
import { authRouter } from "./auth-routes";
import { submissionRouter } from "./submission-routes";

export const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/submission", submissionRouter);
