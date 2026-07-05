import { prisma } from "../../config/db";
import type { UpdateSettingsInput } from "./settings.validation";
import type { Prisma } from "../../generated/prisma/client";

// Sensible Swiss L-GAV starting defaults, applied the first time settings are read.
const DEFAULTS = {
  maxDailyHours: 12.5,
  maxWeeklyHours: 50,
  minRestHoursBetweenShifts: 11,
  minBreakMinutes: 30,
  sessionTimeoutMinutes: 30,
  swapExpiryHours: 72,
};

const settingsSelect = {
  id: true,
  maxDailyHours: true,
  maxWeeklyHours: true,
  minRestHoursBetweenShifts: true,
  minBreakMinutes: true,
  breakRules: true,
  sessionTimeoutMinutes: true,
  notificationPrefs: true,
  swapExpiryHours: true,
  updatedAt: true,
  updatedById: true,
} satisfies Prisma.OrgSettingsSelect;

// There is a single org-wide settings row (id = 1).
const getSettings = async () => {
  return prisma.orgSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...DEFAULTS },
    update: {},
    select: settingsSelect,
  });
};

const updateSettings = async (data: UpdateSettingsInput, adminId: string) => {
  const updateData: Prisma.OrgSettingsUpdateInput = { updatedById: adminId };
  if (data.maxDailyHours !== undefined) updateData.maxDailyHours = data.maxDailyHours;
  if (data.maxWeeklyHours !== undefined) updateData.maxWeeklyHours = data.maxWeeklyHours;
  if (data.minRestHoursBetweenShifts !== undefined)
    updateData.minRestHoursBetweenShifts = data.minRestHoursBetweenShifts;
  if (data.minBreakMinutes !== undefined) updateData.minBreakMinutes = data.minBreakMinutes;
  if (data.sessionTimeoutMinutes !== undefined)
    updateData.sessionTimeoutMinutes = data.sessionTimeoutMinutes;
  if (data.swapExpiryHours !== undefined) updateData.swapExpiryHours = data.swapExpiryHours;

  // Ensure the row exists (with defaults) before applying the partial update.
  await getSettings();

  return prisma.orgSettings.update({
    where: { id: 1 },
    data: updateData,
    select: settingsSelect,
  });
};

export const settingsServices = { getSettings, updateSettings };
