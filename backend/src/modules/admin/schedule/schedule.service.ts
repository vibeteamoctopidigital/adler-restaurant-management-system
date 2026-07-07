import { prisma } from "../../../config/db";
import { AppError } from "../../../utils/AppError";
import type { ListPublicationsQuery } from "./schedule.validation";
import type { Prisma } from "../../../generated/prisma/client";

// ─── Helpers ─────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const monthLabel = (year: number, month: number) =>
  `${MONTH_NAMES[month - 1] ?? month} ${year}`;

// [start, endExclusive) UTC window covering the whole calendar month.
const monthWindow = (year: number, month: number) => ({
  start: new Date(Date.UTC(year, month - 1, 1)),
  endExclusive: new Date(Date.UTC(year, month, 1)),
});

const hoursBetween = (start: Date, end: Date) =>
  Math.round(((end.getTime() - start.getTime()) / 3_600_000) * 100) / 100;

const publicationSelect = {
  id: true,
  year: true,
  month: true,
  status: true,
  note: true,
  publishedAt: true,
  publishedById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SchedulePublicationSelect;

// ─── Month summary (confirmed = admin-APPROVED shift offers) ──────
const getMonthSummary = async (year: number, month: number) => {
  const { start, endExclusive } = monthWindow(year, month);

  const approved = await prisma.shiftOfferResponse.findMany({
    where: {
      approvalStatus: "APPROVED",
      shiftOffer: { startTime: { gte: start, lt: endExclusive } },
    },
    select: {
      userId: true,
      shiftOffer: { select: { startTime: true, endTime: true } },
    },
  });

  const employees = new Set(approved.map((r) => r.userId));
  const scheduledHours =
    Math.round(
      approved.reduce(
        (sum, r) => sum + hoursBetween(r.shiftOffer.startTime, r.shiftOffer.endTime),
        0
      ) * 100
    ) / 100;

  return {
    confirmedShifts: approved.length,
    employeesScheduled: employees.size,
    scheduledHours,
  };
};

// ─── Publish a month ─────────────────────────────────────────────
const publishMonth = async (
  year: number,
  month: number,
  adminId: string,
  note?: string
) => {
  const { start, endExclusive } = monthWindow(year, month);

  // Every active employee confirmed (admin-approved) for ≥1 shift this month.
  const recipients = await prisma.user.findMany({
    where: {
      isActive: true,
      shiftOfferResponses: {
        some: {
          approvalStatus: "APPROVED",
          shiftOffer: { startTime: { gte: start, lt: endExclusive } },
        },
      },
    },
    select: { id: true },
  });

  const now = new Date();
  const label = monthLabel(year, month);

  const publication = await prisma.schedulePublication.upsert({
    where: { year_month: { year, month } },
    create: {
      year,
      month,
      status: "PUBLISHED",
      publishedAt: now,
      publishedById: adminId,
      ...(note !== undefined ? { note } : {}),
    },
    update: {
      status: "PUBLISHED",
      publishedAt: now,
      publishedById: adminId,
      ...(note !== undefined ? { note } : {}),
    },
    select: publicationSelect,
  });

  // Notify the confirmed employees that their schedule is now visible.
  if (recipients.length > 0) {
    await prisma.notification.createMany({
      data: recipients.map((u) => ({
        userId: u.id,
        type: "WEEKLY_SHIFTS_PUBLISHED" as const,
        channel: "IN_APP" as const,
        status: "SENT" as const,
        title: `${label} schedule published`,
        body: `Your ${label} schedule is now available. Tap to view your shifts.`,
        sentAt: now,
        payload: { year, month, scope: "SCHEDULE_PUBLISHED" },
      })),
    });
  }

  const summary = await getMonthSummary(year, month);
  return { publication, notifiedCount: recipients.length, summary };
};

// ─── Unpublish (hide from staff again) ───────────────────────────
const unpublishMonth = async (year: number, month: number) => {
  const existing = await prisma.schedulePublication.findUnique({
    where: { year_month: { year, month } },
    select: { id: true, status: true },
  });
  if (!existing || existing.status !== "PUBLISHED") {
    throw new AppError("This month's schedule is not currently published.", 409);
  }

  return prisma.schedulePublication.update({
    where: { year_month: { year, month } },
    data: { status: "DRAFT", publishedAt: null },
    select: publicationSelect,
  });
};

// ─── Status + summary for a month ────────────────────────────────
const getScheduleStatus = async (year: number, month: number) => {
  const publication = await prisma.schedulePublication.findUnique({
    where: { year_month: { year, month } },
    select: publicationSelect,
  });
  const summary = await getMonthSummary(year, month);

  return {
    year,
    month,
    label: monthLabel(year, month),
    // NOT_PUBLISHED = no row yet (management hasn't touched this month).
    status: publication?.status ?? "NOT_PUBLISHED",
    publication: publication ?? null,
    summary,
  };
};

// ─── Publication history ─────────────────────────────────────────
const listPublications = async (query: ListPublicationsQuery) => {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.SchedulePublicationWhereInput = {};
  if (status) where.status = status;

  const [rows, total] = await Promise.all([
    prisma.schedulePublication.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: publicationSelect,
    }),
    prisma.schedulePublication.count({ where }),
  ]);

  return {
    publications: rows.map((r) => ({ ...r, label: monthLabel(r.year, r.month) })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const adminScheduleServices = {
  publishMonth,
  unpublishMonth,
  getScheduleStatus,
  listPublications,
};
