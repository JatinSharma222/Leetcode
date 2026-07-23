import { Router } from "express";
import { auth } from "../middleware/auth";
import { getSubmissions, submitCode } from "../controllers/submission-controller";

const router = Router();

router.post("/submit", auth, submitCode);
router.get("/submissions", auth, getSubmissions);

export default router;