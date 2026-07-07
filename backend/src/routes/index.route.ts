import { Router } from "express";

// ── Admin feature routers ──────────────────────────────────────────
import adminAuthRouter from "../modules/admin/auth/auth.route";
import overviewRouter from "../modules/admin/overview/overview.route";
import employeesRouter from "../modules/admin/employees/employees.route";
import categoryRouter from "../modules/admin/categories/categories.route";
import adminShiftRouter from "../modules/admin/shifts/shifts.route";
import workloadRouter from "../modules/admin/workload/workload.route";
import demandRouter from "../modules/admin/demands/demands.route";
import reportRouter from "../modules/admin/reports/reports.route";
import settingsRouter from "../modules/admin/settings/settings.route";
import adminSwapRouter from "../modules/admin/swaps/swaps.route";
import adminAvailabilityRouter from "../modules/admin/availability/availability.route";
import adminScheduleRouter from "../modules/admin/schedule/schedule.route";

// ── Staff (user) feature routers ───────────────────────────────────
import userAuthRouter from "../modules/user/auth/auth.route";
import userShiftRouter from "../modules/user/shifts/shifts.route";
import notificationRouter from "../modules/user/notifications/notifications.route";
import userSwapRouter from "../modules/user/swaps/swaps.route";
import userAvailabilityRouter from "../modules/user/availability/availability.route";
import userScheduleRouter from "../modules/user/schedule/schedule.route";

const indexRouter = Router();

// ── Authentication ─────────────────────────────────────────────────
indexRouter.use("/auth/admin", adminAuthRouter);
indexRouter.use("/auth/user", userAuthRouter);

// ── Admin management ───────────────────────────────────────────────
indexRouter.use("/admin/overview", overviewRouter);
indexRouter.use("/admin/users", employeesRouter);
indexRouter.use("/admin/categories", categoryRouter);
indexRouter.use("/admin/shifts", adminShiftRouter);
indexRouter.use("/admin/workload", workloadRouter);
indexRouter.use("/admin/demands", demandRouter);
indexRouter.use("/admin/reports", reportRouter);
indexRouter.use("/admin/settings", settingsRouter);
indexRouter.use("/admin/swaps", adminSwapRouter);
indexRouter.use("/admin/availability", adminAvailabilityRouter);
indexRouter.use("/admin/schedule", adminScheduleRouter);

// ── Staff (mobile) ─────────────────────────────────────────────────
indexRouter.use("/shifts", userShiftRouter);
indexRouter.use("/notifications", notificationRouter);
indexRouter.use("/swaps", userSwapRouter);
indexRouter.use("/availability", userAvailabilityRouter);
indexRouter.use("/schedule", userScheduleRouter);

export default indexRouter;
