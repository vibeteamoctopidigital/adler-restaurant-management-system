import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateRequest } from "../../middleware/validateRequest";
import { authenticate, authorizeUser } from "../../middleware/auth";
import { respondToShiftSchema, listUserShiftsQuerySchema } from "./shift.validation";
import * as userShiftController from "./shift.controller";

const userShiftRouter = Router();

// All staff-facing shift routes require an authenticated staff user.
userShiftRouter.use(authenticate, authorizeUser);

userShiftRouter.get(
  "/",
  validateRequest(listUserShiftsQuerySchema),
  asyncHandler(userShiftController.listShifts)
);

userShiftRouter.get("/:shiftId", asyncHandler(userShiftController.getShift));

// Accept or decline a shift.
userShiftRouter.post(
  "/:shiftId/respond",
  validateRequest(respondToShiftSchema),
  asyncHandler(userShiftController.respondToShift)
);

export default userShiftRouter;
