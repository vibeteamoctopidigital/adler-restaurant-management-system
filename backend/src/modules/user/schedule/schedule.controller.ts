import type { Request, Response } from "express";
import { userScheduleServices } from "./schedule.service";
import { sendSuccess } from "../../../utils/apiResponse";
import type { ScheduleViewQuery } from "./schedule.validation";

// ─── My schedule (day / week / month) ────────────────────────────
export const getMySchedule = async (req: Request, res: Response): Promise<void> => {
  const userId = res.locals.auth!.userId;
  const query = req.validated as ScheduleViewQuery;

  const result = await userScheduleServices.getMySchedule(userId, query);

  sendSuccess(res, {
    statusCode: 200,
    message: result.published
      ? "Schedule fetched successfully."
      : "Schedule is not published yet.",
    data: result,
  });
};

// ─── Published months (month switcher) ───────────────────────────
export const listMonths = async (_req: Request, res: Response): Promise<void> => {
  const months = await userScheduleServices.listPublishedMonths();

  sendSuccess(res, {
    statusCode: 200,
    message: "Published months fetched successfully.",
    data: { months },
  });
};
