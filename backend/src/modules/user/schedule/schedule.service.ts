import { prisma } from "../../../config/db";
import type { ScheduleViewQuery } from "./schedule.validation";
import type { Prisma } from "../../../generated/prisma/client";

// ─── Date helpers (all UTC — shift times are stored in UTC) ──────
const startOfUTCDay = (d: Date) =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
};

const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const monthLabel = (year: number, month: number) =>
  `${MONTH_NAMES[month - 1] ?? month} ${year}`;

const hoursBetween = (start: Date, end: Date) =>
  Math.round(((end.getTime() - start.getTime()) / 3_600_000) * 100) / 100;

const monthKey = (d: Date) => `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;

// Resolve the reference day the view is anchored on: explicit year+month →
// that month's first day; else an explicit date; else today.
const resolveAnchor = (q: ScheduleViewQuery): Date => {
  if (q.year !== undefined && q.month !== undefined) {
    return new Date(Date.UTC(q.year, q.month - 1, 1));
  }
  if (q.date !== undefined) return startOfUTCDay(new Date(q.date));
  return startOfUTCDay(new Date());
};

// [start, endExclusive) window for the chosen view.
const computeWindow = (view: ScheduleViewQuery["view"], anchor: Date) => {
  if (view === "day") {
    return { start: anchor, endExclusive: addDays(anchor, 1) };
  }
  if (view === "week") {
    const dow = (anchor.getUTCDay() + 6) % 7; // days since Monday
    const start = addDays(anchor, -dow);
    return { start, endExclusive: addDays(start, 7) };
  }
  const start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
  const endExclusive = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1));
  return { start, endExclusive };
};

// Every calendar month the window touches (a week can straddle two months).
const monthsInRange = (start: Date, endExclusive: Date) => {
  const months: { year: number; month: number }[] = [];
  let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cur < endExclusive) {
    months.push({ year: cur.getUTCFullYear(), month: cur.getUTCMonth() + 1 });
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
  }
  return months;
};

// The caller's confirmed shifts = shift offers they are admin-APPROVED for.
const scheduleShiftSelect = {
  approvedAt: true,
  shiftOffer: {
    select: {
      id: true,
      jobTitle: true,
      startTime: true,
      endTime: true,
      hourlyPrice: true,
      description: true,
      category: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ShiftOfferResponseSelect;

type ApprovedResponse = Prisma.ShiftOfferResponseGetPayload<{
  select: typeof scheduleShiftSelect;
}>;

// ─── My schedule (gated by month publication, sortable) ──────────
const getMySchedule = async (userId: string, q: ScheduleViewQuery) => {
  const anchor = resolveAnchor(q);
  const { start, endExclusive } = computeWindow(q.view, anchor);
  const months = monthsInRange(start, endExclusive);

  // Which of the touched months are actually published to staff.
  const publications = await prisma.schedulePublication.findMany({
    where: { OR: months.map((m) => ({ year: m.year, month: m.month })) },
    select: { year: true, month: true, status: true, publishedAt: true },
  });
  const pubMap = new Map(publications.map((p) => [`${p.year}-${p.month}`, p]));

  const monthStatuses = months.map((m) => {
    const p = pubMap.get(`${m.year}-${m.month}`);
    const published = p?.status === "PUBLISHED";
    return {
      year: m.year,
      month: m.month,
      label: monthLabel(m.year, m.month),
      published,
      publishedAt: published ? p?.publishedAt ?? null : null,
    };
  });
  const publishedKeys = new Set(
    monthStatuses.filter((m) => m.published).map((m) => `${m.year}-${m.month}`)
  );
  const allPublished = monthStatuses.every((m) => m.published);

  // Drafts are never visible: only fetch shifts when a month is published, and
  // only keep the ones that fall inside a published month.
  let responses: ApprovedResponse[] = [];
  if (publishedKeys.size > 0) {
    responses = await prisma.shiftOfferResponse.findMany({
      where: {
        userId,
        approvalStatus: "APPROVED",
        shiftOffer: { startTime: { gte: start, lt: endExclusive } },
      },
      orderBy: { shiftOffer: { startTime: "asc" } },
      select: scheduleShiftSelect,
    });
  }

  const shifts = responses
    .filter((r) => publishedKeys.has(monthKey(r.shiftOffer.startTime)))
    .map((r) => {
      const o = r.shiftOffer;
      return {
        id: o.id,
        jobTitle: o.jobTitle,
        category: o.category,
        startTime: o.startTime,
        endTime: o.endTime,
        hours: hoursBetween(o.startTime, o.endTime),
        hourlyPrice: o.hourlyPrice,
        description: o.description,
        confirmedAt: r.approvedAt,
      };
    });

  // Group by calendar day so the app can render the schedule day-by-day.
  type ShiftRow = (typeof shifts)[number];
  const groupsMap = new Map<string, { date: string; shifts: ShiftRow[]; hours: number }>();
  for (const s of shifts) {
    const key = dateOnly(s.startTime);
    let group = groupsMap.get(key);
    if (!group) {
      group = { date: key, shifts: [], hours: 0 };
      groupsMap.set(key, group);
    }
    group.shifts.push(s);
    group.hours = Math.round((group.hours + s.hours) * 100) / 100;
  }
  const groups = [...groupsMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  const totals = {
    shiftCount: shifts.length,
    scheduledHours:
      Math.round(shifts.reduce((sum, s) => sum + s.hours, 0) * 100) / 100,
  };

  const result: {
    view: ScheduleViewQuery["view"];
    range: { start: string; end: string };
    months: typeof monthStatuses;
    published: boolean;
    shifts: ShiftRow[];
    groups: typeof groups;
    totals: typeof totals;
    period?: { year: number; month: number; label: string };
    publishedAt?: Date | null;
  } = {
    view: q.view,
    range: { start: dateOnly(start), end: dateOnly(addDays(endExclusive, -1)) },
    months: monthStatuses,
    published: allPublished,
    shifts,
    groups,
    totals,
  };

  // Single-month views (day within a month, or month) get a convenient
  // top-level period + publishedAt — this drives the "August isn't published
  // yet" empty state on the staff app.
  if (monthStatuses.length === 1) {
    const m = monthStatuses[0]!;
    result.period = { year: m.year, month: m.month, label: m.label };
    result.publishedAt = m.publishedAt;
  }

  return result;
};

// ─── Published months (for the app's month switcher) ─────────────
const listPublishedMonths = async () => {
  const rows = await prisma.schedulePublication.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { year: true, month: true, publishedAt: true },
  });
  return rows.map((r) => ({ ...r, label: monthLabel(r.year, r.month) }));
};

export const userScheduleServices = {
  getMySchedule,
  listPublishedMonths,
};
