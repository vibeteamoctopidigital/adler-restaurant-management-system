import { prisma } from "../../../config/db";
import { AppError } from "../../../utils/AppError";
import type { HoursQuery } from "./hours.validation";

// Hours are derived from admin-APPROVED shift-offer acceptances whose shift
// falls in the month — the same source the admin Reports use, scoped to the
// calling employee. There is no separate time-clock yet, so a shift's hours are
// its scheduled duration; a shift counts as "worked" once it has ended.
const HOURS_PER_MS = 1 / (1000 * 60 * 60);
const round2 = (n: number) => Math.round(n * 100) / 100;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const monthLabel = (year: number, month: number) =>
  `${MONTH_NAMES[month - 1] ?? month} ${year}`;

const monthRange = (year: number, month: number) => ({
  start: new Date(Date.UTC(year, month - 1, 1)),
  end: new Date(Date.UTC(year, month, 1)),
});

// ─── My hours for a month ────────────────────────────────────────
const getMyHours = async (userId: string, query: HoursQuery) => {
  const now = new Date();
  const year = query.year ?? now.getUTCFullYear();
  const month = query.month ?? now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      workloadPercent: true,
      contractType: true,
      contractedHoursMonthly: true,
      hourlyRate: true,
      monthlySalary: true,
    },
  });
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const responses = await prisma.shiftOfferResponse.findMany({
    where: {
      userId,
      approvalStatus: "APPROVED",
      shiftOffer: { startTime: { gte: start, lt: end } },
    },
    orderBy: { shiftOffer: { startTime: "asc" } },
    select: {
      approvedAt: true,
      shiftOffer: {
        select: {
          id: true,
          jobTitle: true,
          startTime: true,
          endTime: true,
          hourlyPrice: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
  });

  const nowMs = now.getTime();
  const shifts = responses.map((r) => {
    const o = r.shiftOffer;
    return {
      id: o.id,
      jobTitle: o.jobTitle,
      category: o.category,
      startTime: o.startTime,
      endTime: o.endTime,
      hours: round2((o.endTime.getTime() - o.startTime.getTime()) * HOURS_PER_MS),
      hourlyPrice: o.hourlyPrice,
      // "Worked so far" once the shift has ended; otherwise it's still upcoming.
      completed: o.endTime.getTime() <= nowMs,
      confirmedAt: r.approvedAt,
    };
  });

  const scheduledHours = round2(shifts.reduce((s, x) => s + x.hours, 0));
  const workedHours = round2(
    shifts.filter((x) => x.completed).reduce((s, x) => s + x.hours, 0)
  );

  const target = user.contractedHoursMonthly !== null ? Number(user.contractedHoursMonthly) : null;
  const hourlyRate = user.hourlyRate !== null ? Number(user.hourlyRate) : null;
  const monthlySalary = user.monthlySalary !== null ? Number(user.monthlySalary) : null;

  const overtimeHours = target !== null ? round2(Math.max(0, scheduledHours - target)) : 0;
  const remainingHours = target !== null ? round2(Math.max(0, target - scheduledHours)) : null;

  // The caller's own earnings estimate: hourly staff bill worked hours; salaried
  // staff their fixed monthly salary (matches the Reports wage logic).
  const estimatedEarnings =
    hourlyRate !== null
      ? round2(workedHours * hourlyRate)
      : monthlySalary !== null
        ? round2(monthlySalary)
        : null;

  return {
    period: { year, month, label: monthLabel(year, month) },
    summary: {
      workedHours, // completed shifts so far
      scheduledHours, // all confirmed shifts this month
      targetHours: target, // contracted hours ("Target 100%")
      workloadPercent: user.workloadPercent !== null ? Number(user.workloadPercent) : null,
      overtimeHours,
      remainingHours,
      shiftCount: shifts.length,
      contractType: user.contractType,
      hourlyRate,
      estimatedEarnings,
    },
    shifts,
  };
};

export const userHoursServices = {
  getMyHours,
};
