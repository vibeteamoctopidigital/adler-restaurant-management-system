import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authorizeCron } from "../../middleware/auth";
import * as reminderController from "./reminders.controller";

const cronReminderRouter = Router();

// Scheduler-triggered dispatch. Vercel Cron invokes with GET; POST is also
// accepted for other schedulers. Guarded by the shared CRON_SECRET.
cronReminderRouter.get("/", authorizeCron, asyncHandler(reminderController.cronDispatch));
cronReminderRouter.post("/", authorizeCron, asyncHandler(reminderController.cronDispatch));

export default cronReminderRouter;
