import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { validateRequest } from "../../../middleware/validateRequest";
import { authenticate } from "../../../middleware/auth";
import { authLimiter } from "../../../middleware/rateLimit";
import { userLoginSchema } from "./auth.validation";
import * as userController from "./auth.controller";

const userAuthRouter = Router();

// Public routes — throttled to blunt brute-force / credential-stuffing.
userAuthRouter.post("/login", authLimiter, validateRequest(userLoginSchema), asyncHandler(userController.login));
userAuthRouter.post("/refresh", authLimiter, asyncHandler(userController.refreshToken));

// Protected routes
userAuthRouter.post("/logout", authenticate, asyncHandler(userController.logout));
userAuthRouter.get("/profile", authenticate, asyncHandler(userController.getProfile));

export default userAuthRouter;
