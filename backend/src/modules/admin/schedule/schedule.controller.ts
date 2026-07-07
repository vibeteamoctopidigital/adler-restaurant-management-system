import type { Request, Response } from "express";
import { adminScheduleServices } from "./schedule.service";
import { sendSuccess } from "../../../utils/apiResponse";
import type {
  PublishScheduleInput,
  UnpublishScheduleInput,
  ScheduleStatusQuery,
  ListPublicationsQuery,
} from "./schedule.validation";

// ─── Publish a month's schedule ──────────────────────────────────
export const publishSchedule = async (req: Request, res: Response): Promise<void> => {
  const data = req.validated as PublishScheduleInput;
  const adminId = res.locals.auth!.userId;

  const result = await adminScheduleServices.publishMonth(
    data.year,
    data.month,
    adminId,
    data.note
  );

  sendSuccess(res, {
    statusCode: 200,
    message: `Schedule published. Notified ${result.notifiedCount} employee(s).`,
    data: result,
  });
};

// ─── Unpublish a month's schedule ────────────────────────────────
export const unpublishSchedule = async (req: Request, res: Response): Promise<void> => {
  const data = req.validated as UnpublishScheduleInput;

  const publication = await adminScheduleServices.unpublishMonth(data.year, data.month);

  sendSuccess(res, {
    statusCode: 200,
    message: "Schedule unpublished. It is hidden from staff again.",
    data: { publication },
  });
};

// ─── Month status + confirmed-schedule summary ───────────────────
export const getStatus = async (req: Request, res: Response): Promise<void> => {
  const query = req.validated as ScheduleStatusQuery;

  const now = new Date();
  const year = query.year ?? now.getUTCFullYear();
  const month = query.month ?? now.getUTCMonth() + 1;

  const result = await adminScheduleServices.getScheduleStatus(year, month);

  sendSuccess(res, {
    statusCode: 200,
    message: "Schedule status fetched successfully.",
    data: result,
  });
};

// ─── Publication history ─────────────────────────────────────────
export const listPublications = async (req: Request, res: Response): Promise<void> => {
  const query = req.validated as ListPublicationsQuery;

  const result = await adminScheduleServices.listPublications(query);

  sendSuccess(res, {
    statusCode: 200,
    message: "Schedule publications fetched successfully.",
    data: { publications: result.publications },
    meta: { pagination: result.pagination },
  });
};
