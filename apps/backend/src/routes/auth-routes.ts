import { Router } from "express";
import { signin, signup, signout, getMe } from "../controllers/auth-controller";
import { auth } from "../middleware/auth";
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
authRouter.post("/signout", signout);
authRouter.post("/logout", signout);
authRouter.get("/me", auth, getMe);

