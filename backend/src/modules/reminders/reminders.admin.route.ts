import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticate, authorizeAdmin } from "../../middleware/auth";
import { dispatchSchema, upcomingQuerySchema } from "./reminders.validation";
import * as reminderController from "./reminders.controller";

const adminReminderRouter = Router();

// Admin-guarded: manual dispatch (testing / backfill) + upcoming visibility.
adminReminderRouter.use(authenticate, authorizeAdmin);

adminReminderRouter.post(
  "/dispatch",
  validateRequest(dispatchSchema),
  asyncHandler(reminderController.adminDispatch)
);

adminReminderRouter.get(
  "/upcoming",
  validateRequest(upcomingQuerySchema),
  asyncHandler(reminderController.adminUpcoming)
);

export default adminReminderRouter;
