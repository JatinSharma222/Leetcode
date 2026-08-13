import { Router } from "express";
import { getQuestions, getQuestionById } from "../controllers/question-controller";

export const questionRouter = Router();

questionRouter.get("/", getQuestions);
questionRouter.get("/:id", getQuestionById);
