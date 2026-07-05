import { prisma } from "../../../config/db";
import { reportServices } from "../reports/reports.service";

// Dashboard "Overview" stat tiles for the admin webapp.
const getOverview = async () => {
  const now = new Date();

  const [
    activeEmployees,
    inactiveEmployees,
    topCategories,
    subCategories,
    draftShifts,
    upcomingShifts,
    pendingApprovals,
    shiftsAwaitingApproval,
    pendingSwaps,
    thisMonth,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.category.count({ where: { parentId: null } }),
    prisma.category.count({ where: { parentId: { not: null } } }),
    prisma.shiftOffer.count({ where: { notifiedAt: null } }),
    prisma.shiftOffer.count({ where: { notifiedAt: { not: null }, endTime: { gte: now } } }),
    // Individual acceptances still waiting on an admin decision.
    prisma.shiftOfferResponse.count({
      where: { status: "ACCEPTED", approvalStatus: "PENDING" },
    }),
    // Distinct published shifts that have at least one pending acceptance.
    prisma.shiftOffer.count({
      where: {
        notifiedAt: { not: null },
        responses: { some: { status: "ACCEPTED", approvalStatus: "PENDING" } },
      },
    }),
    // Shift swaps waiting on the admin's review.
    prisma.shiftSwapRequest.count({ where: { status: "PENDING" } }),
    // Scheduled/worked hours, overtime and wage cost for the current month.
    reportServices.buildReport({}),
  ]);

  return {
    employees: {
      active: activeEmployees,
      inactive: inactiveEmployees,
      total: activeEmployees + inactiveEmployees,
    },
    categories: {
      total: topCategories,
      subCategories,
    },
    shifts: {
      draft: draftShifts,
      upcoming: upcomingShifts,
      awaitingApproval: shiftsAwaitingApproval,
    },
    approvals: {
      pendingResponses: pendingApprovals,
    },
    swaps: {
      pending: pendingSwaps,
    },
    thisMonth: {
      period: thisMonth.period,
      scheduledHours: thisMonth.summary.totalWorked,
      overtime: thisMonth.summary.overtime,
      hoursDue: thisMonth.summary.hoursDue,
      wageCost: thisMonth.summary.wageCost,
    },
    availability: await getAvailabilitySummary(),
  };
};

// Availability submission progress for the most recently opened month.
const getAvailabilitySummary = async () => {
  const latest = await prisma.availabilityMonth.findFirst({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { year: true, month: true },
  });
  if (!latest) return null;

  const [total, submitted, pendingRows] = await Promise.all([
    prisma.availabilityMonth.count({ where: { year: latest.year, month: latest.month } }),
    prisma.availabilityMonth.count({
      where: { year: latest.year, month: latest.month, status: "SUBMITTED" },
    }),
    prisma.availabilityMonth.findMany({
      where: { year: latest.year, month: latest.month, status: { not: "SUBMITTED" } },
      take: 20,
      select: {
        user: { select: { id: true, name: true, firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  return {
    year: latest.year,
    month: latest.month,
    submitted,
    total,
    notSubmitted: pendingRows.map((r) => r.user),
  };
};

export const overviewServices = { getOverview };
