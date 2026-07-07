import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { validateRequest } from "../../../middleware/validateRequest";
import { authenticate, authorizeUser } from "../../../middleware/auth";
import { scheduleViewQuerySchema } from "./schedule.validation";
import * as scheduleController from "./schedule.controller";

const userScheduleRouter = Router();

// All staff schedule routes require an authenticated staff user.
userScheduleRouter.use(authenticate, authorizeUser);

// Published months for the month switcher — before "/" so it isn't shadowed.
userScheduleRouter.get("/months", asyncHandler(scheduleController.listMonths));

// My confirmed schedule, sortable by day / week / month.
userScheduleRouter.get(
  "/",
  validateRequest(scheduleViewQuerySchema),
  asyncHandler(scheduleController.getMySchedule)
);

export default userScheduleRouter;
