import { Router } from "express";
import { authRouter } from "./auth-routes.ts";
import { submissionRouter } from "./submission-routes.ts";

export const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/submission", submissionRouter);