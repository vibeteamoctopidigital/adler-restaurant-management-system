import { z } from "zod";

export const updateSettingsSchema = z
  .object({
    maxDailyHours: z.number().min(0).max(24).optional(),
    maxWeeklyHours: z.number().min(0).max(168).optional(),
    minRestHoursBetweenShifts: z.number().min(0).max(48).optional(),
    minBreakMinutes: z.number().int().min(0).max(480).optional(),
    sessionTimeoutMinutes: z.number().int().min(1).max(1440).optional(),
    swapExpiryHours: z.number().int().min(1).max(720).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one setting to update.",
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
