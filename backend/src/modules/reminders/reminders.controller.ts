import type { Request, Response } from "express";
import { remindersService } from "./reminders.service";
import { sendSuccess } from "../../utils/apiResponse";
import type { DispatchInput, UpcomingQuery } from "./reminders.validation";

// ─── Cron dispatch (scheduler-triggered) ─────────────────────────
export const cronDispatch = async (_req: Request, res: Response): Promise<void> => {
  const result = await remindersService.dispatchDueReminders();

  sendSuccess(res, {
    statusCode: 200,
    message: `Dispatched ${result.sent} reminder(s).`,
    data: result,
  });
};

// ─── Admin manual dispatch (optional `at` override) ──────────────
export const adminDispatch = async (req: Request, res: Response): Promise<void> => {
  const body = req.validated as DispatchInput;

  const result = await remindersService.dispatchDueReminders(
    body.at ? { now: new Date(body.at) } : {}
  );

  sendSuccess(res, {
    statusCode: 200,
    message: `Dispatched ${result.sent} reminder(s).`,
    data: result,
  });
};

// ─── Upcoming reminders (admin visibility) ───────────────────────
export const adminUpcoming = async (req: Request, res: Response): Promise<void> => {
  const query = req.validated as UpcomingQuery;

  const upcoming = await remindersService.listUpcoming(query.withinHours);

  sendSuccess(res, {
    statusCode: 200,
    message: "Upcoming reminders fetched successfully.",
    data: { upcoming },
  });
};
