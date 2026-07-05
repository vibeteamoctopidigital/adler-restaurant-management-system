import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { validateRequest } from "../../../middleware/validateRequest";
import { authenticate } from "../../../middleware/auth";
import { userLoginSchema } from "./auth.validation";
import * as userController from "./auth.controller";

const userAuthRouter = Router();

// Public routes
userAuthRouter.post("/login", validateRequest(userLoginSchema), asyncHandler(userController.login));
userAuthRouter.post("/refresh", asyncHandler(userController.refreshToken));

// Protected routes
userAuthRouter.post("/logout", authenticate, asyncHandler(userController.logout));
userAuthRouter.get("/profile", authenticate, asyncHandler(userController.getProfile));

export default userAuthRouter;
