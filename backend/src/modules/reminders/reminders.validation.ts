import { z } from "zod";

// Admin manual dispatch. `at` is an optional override of "now" — for testing or
// backfilling a missed window (admin-only).
export const dispatchSchema = z.object({
  at: z.string().datetime({ message: "at must be an ISO 8601 date-time" }).optional(),
});

export const upcomingQuerySchema = z.object({
  withinHours: z.coerce.number().int().min(1).max(168).default(24),
});

export type DispatchInput = z.infer<typeof dispatchSchema>;
export type UpcomingQuery = z.infer<typeof upcomingQuerySchema>;
