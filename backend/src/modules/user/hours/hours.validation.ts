import { z } from "zod";

// The staff "My Hours" (payroll) view for a month. year/month are optional and
// default to the current month, resolved in the service.
export const hoursQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type HoursQuery = z.infer<typeof hoursQuerySchema>;
