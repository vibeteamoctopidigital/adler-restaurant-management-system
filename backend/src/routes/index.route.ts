import { Router } from "express";
import adminAuthRouter from "../modules/admin/admin.route";
import userAuthRouter from "../modules/user/user.route";
import userManagementRouter from "../modules/admin/user-management.route";

const indexRouter = Router();

// Auth routes
indexRouter.use("/auth/admin", adminAuthRouter);
indexRouter.use("/auth/user", userAuthRouter);

// Admin user management routes
indexRouter.use("/admin/users", userManagementRouter);

export default indexRouter;