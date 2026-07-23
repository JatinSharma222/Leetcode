import { Router } from "express";
import { authRouter } from "./auth-routes.ts";

export const appRouter = Router();

appRouter.use(authRouter);