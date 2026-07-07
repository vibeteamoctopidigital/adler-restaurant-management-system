import { Router } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { validateRequest } from "../../../middleware/validateRequest";
import { authenticate, authorizeUser } from "../../../middleware/auth";
import { hoursQuerySchema } from "./hours.validation";
import * as hoursController from "./hours.controller";

const userHoursRouter = Router();

// Staff-guarded — an employee only ever sees their own hours.
userHoursRouter.use(authenticate, authorizeUser);

// My hours for a month (defaults to the current month).
userHoursRouter.get(
  "/",
  validateRequest(hoursQuerySchema),
  asyncHandler(hoursController.getMyHours)
);

export default userHoursRouter;
