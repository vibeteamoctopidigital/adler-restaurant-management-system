import { z } from "zod";

// Accepts either a date-only ("2026-08-08") or a full ISO date-time string.
const dateString = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .refine((s) => !Number.isNaN(Date.parse(s)), {
      message: `${label} must be a valid date`,
    });

// The staff "My schedule" view. `view` chooses how the confirmed shifts are
// windowed/sorted: a single day, the Monday-based week, or the calendar month.
// The reference point is either an explicit year+month, a `date`, or (default)
// today.
export const scheduleViewQuerySchema = z
  .object({
    view: z.enum(["day", "week", "month"]).default("month"),
    date: dateString("Reference date").optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  })
  .refine((q) => (q.year === undefined) === (q.month === undefined), {
    message: "Provide both year and month, or neither.",
    path: ["month"],
  });

export type ScheduleViewQuery = z.infer<typeof scheduleViewQuerySchema>;
