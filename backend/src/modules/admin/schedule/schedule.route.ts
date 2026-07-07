import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { validateRequest } from "../../../middleware/validateRequest";
import { authenticate, authorizeAdmin } from "../../../middleware/auth";
import {
  publishScheduleSchema,
  unpublishScheduleSchema,
  scheduleStatusQuerySchema,
  listPublicationsQuerySchema,
} from "./schedule.validation";
import * as scheduleController from "./schedule.controller";

const scheduleRouter = Router();

// All schedule-publication routes require admin authentication.
scheduleRouter.use(authenticate, authorizeAdmin);

// Publish / unpublish a month (the gate that makes staff schedules visible).
scheduleRouter.post(
  "/publish",
  validateRequest(publishScheduleSchema),
  asyncHandler(scheduleController.publishSchedule)
);

scheduleRouter.post(
  "/unpublish",
  validateRequest(unpublishScheduleSchema),
  asyncHandler(scheduleController.unpublishSchedule)
);

// Publication history — declared before "/" so it isn't shadowed.
scheduleRouter.get(
  "/publications",
  validateRequest(listPublicationsQuerySchema),
  asyncHandler(scheduleController.listPublications)
);

// Status + summary for a month (defaults to the current month).
scheduleRouter.get(
  "/",
  validateRequest(scheduleStatusQuerySchema),
  asyncHandler(scheduleController.getStatus)
);

export default scheduleRouter;
