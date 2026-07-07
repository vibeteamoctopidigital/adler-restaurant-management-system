import type { Request, Response } from "express";
import { userHoursServices } from "./hours.service";
import { sendSuccess } from "../../../utils/apiResponse";
import type { HoursQuery } from "./hours.validation";

// ─── My hours (payroll) ──────────────────────────────────────────
export const getMyHours = async (req: Request, res: Response): Promise<void> => {
  const userId = res.locals.auth!.userId;
  const query = req.validated as HoursQuery;

  const result = await userHoursServices.getMyHours(userId, query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Hours fetched successfully.",
    data: result,
  });
};
