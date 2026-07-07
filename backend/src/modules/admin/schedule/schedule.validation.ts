import { z } from "zod";

const year = z.coerce.number().int().min(2000).max(2100);
const month = z.coerce.number().int().min(1).max(12);

// Publish a month's schedule — flips the gate so staff can see their confirmed
// shifts for that month and fans out a "schedule published" notification.
export const publishScheduleSchema = z.object({
  year,
  month,
  note: z.string().trim().max(500).optional(),
});

// Take a published month back to DRAFT (hides it from staff again).
export const unpublishScheduleSchema = z.object({
  year,
  month,
});

// Status + summary for a month (year/month optional — defaults to the current
// month, resolved in the controller).
export const scheduleStatusQuerySchema = z.object({
  year: year.optional(),
  month: month.optional(),
});

export const listPublicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export type PublishScheduleInput = z.infer<typeof publishScheduleSchema>;
export type UnpublishScheduleInput = z.infer<typeof unpublishScheduleSchema>;
export type ScheduleStatusQuery = z.infer<typeof scheduleStatusQuerySchema>;
export type ListPublicationsQuery = z.infer<typeof listPublicationsQuerySchema>;
