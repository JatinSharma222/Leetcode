import { Router } from "express";
import { signin, signup } from "../controllers/auth-controller";
import { createRateLimiter } from "../middleware/rate-limiter";

export const authRouter = Router();

const authRateLimiter = createRateLimiter({
  max: 10,
  windowMs: 60 * 1000,
  keyPrefix: "ratelimit:auth:",
  message: "Too many authentication attempts. Please try again later.",
  useRedis: true,
});

authRouter.post("/signup", authRateLimiter, signup);
authRouter.post("/signin", authRateLimiter, signin);
