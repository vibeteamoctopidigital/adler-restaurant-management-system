import { Router } from "express";
import adminAuthRouter from "../modules/admin/admin.route";
import userAuthRouter from "../modules/user/user.route";
import userManagementRouter from "../modules/admin/user-management.route";
import categoryRouter from "../modules/admin/category.route";
import adminShiftRouter from "../modules/admin/shift.route";
import reportRouter from "../modules/admin/report.route";
import overviewRouter from "../modules/admin/overview.route";
import settingsRouter from "../modules/admin/settings.route";
import adminSwapRouter from "../modules/admin/swap.route";
import userShiftRouter from "../modules/user/shift.route";
import notificationRouter from "../modules/user/notification.route";
import userSwapRouter from "../modules/user/swap.route";

const indexRouter = Router();

// Auth routes
indexRouter.use("/auth/admin", adminAuthRouter);
indexRouter.use("/auth/user", userAuthRouter);

// Admin management routes
indexRouter.use("/admin/overview", overviewRouter);
indexRouter.use("/admin/users", userManagementRouter);
indexRouter.use("/admin/categories", categoryRouter);
indexRouter.use("/admin/shifts", adminShiftRouter);
indexRouter.use("/admin/reports", reportRouter);
indexRouter.use("/admin/settings", settingsRouter);
indexRouter.use("/admin/swaps", adminSwapRouter);

// Staff (user) routes
indexRouter.use("/shifts", userShiftRouter);
indexRouter.use("/notifications", notificationRouter);
indexRouter.use("/swaps", userSwapRouter);

export default indexRouter;