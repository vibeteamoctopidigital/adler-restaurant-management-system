import { prisma } from "../../config/db";
import { envConfig } from "../../config/env";
import { logger } from "../../utils/logger";

// Reminders fire this many minutes before a confirmed shift's start time.
const OFFSETS_MIN = [300, 180, 60] as const; // 5h · 3h · 1h
const MAX_OFFSET_MIN = 300;
// A reminder is only sent within this window after it becomes due. This keeps
// dispatch idempotent-in-time: a shift confirmed late (e.g. 2h before start)
// silently skips its already-past 5h/3h reminders and only fires the still-
// relevant ones; and a long dispatcher outage won't unleash a burst of stale
// reminders. It comfortably covers one missed run (interval default 15 min).
const CATCHUP_MIN = 20;

const hoursLabel = (min: number) => {
  const h = min / 60;
  return `${h} hour${h === 1 ? "" : "s"}`;
};

// ─── Dispatch due reminders (idempotent) ─────────────────────────
const dispatchDueReminders = async (opts: { now?: Date } = {}) => {
  const now = opts.now ?? new Date();
  const nowMs = now.getTime();
  const horizon = new Date(nowMs + MAX_OFFSET_MIN * 60_000);

  // Confirmed (admin-APPROVED) shifts starting within the max reminder window.
  const responses = await prisma.shiftOfferResponse.findMany({
    where: {
      approvalStatus: "APPROVED",
      shiftOffer: { startTime: { gt: now, lte: horizon } },
    },
    select: {
      id: true,
      userId: true,
      shiftOffer: {
        select: {
          id: true,
          jobTitle: true,
          startTime: true,
          category: { select: { name: true } },
        },
      },
      reminders: { select: { offsetMinutes: true } },
    },
  });

  const byOffset: Record<number, number> = { 300: 0, 180: 0, 60: 0 };
  let sent = 0;

  for (const r of responses) {
    const startMs = r.shiftOffer.startTime.getTime();
    if (startMs <= nowMs) continue; // already started
    const already = new Set(r.reminders.map((x) => x.offsetMinutes));

    for (const offset of OFFSETS_MIN) {
      if (already.has(offset)) continue; // already sent (dedup)
      const dueMs = startMs - offset * 60_000;
      if (dueMs > nowMs) continue; // not due yet
      if (nowMs - dueMs > CATCHUP_MIN * 60_000) continue; // stale — skip

      try {
        // The unique (response, offset) row is the idempotency guard — if a
        // concurrent run already inserted it, the create throws P2002 and we
        // skip without sending a duplicate notification.
        await prisma.$transaction(async (tx) => {
          const reminder = await tx.shiftReminder.create({
            data: { shiftOfferResponseId: r.id, offsetMinutes: offset, sentAt: now },
          });
          const notification = await tx.notification.create({
            data: {
              userId: r.userId,
              type: "SHIFT_REMINDER",
              channel: "IN_APP",
              status: "SENT",
              title: "Upcoming shift reminder",
              body: `Your shift "${r.shiftOffer.jobTitle}" (${r.shiftOffer.category.name}) starts in ${hoursLabel(offset)}.`,
              sentAt: now,
              payload: {
                shiftOfferId: r.shiftOffer.id,
                offsetMinutes: offset,
                hoursBefore: offset / 60,
                startTime: r.shiftOffer.startTime.toISOString(),
              },
            },
          });
          await tx.shiftReminder.update({
            where: { id: reminder.id },
            data: { notificationId: notification.id },
          });
        });
        sent += 1;
        byOffset[offset] = (byOffset[offset] ?? 0) + 1;
      } catch (err) {
        // P2002 = unique violation = already sent by another run; ignore.
        if ((err as { code?: string })?.code !== "P2002") throw err;
      }
    }
  }

  return { at: now.toISOString(), scannedResponses: responses.length, sent, byOffset };
};

// ─── Upcoming reminders (admin visibility) ───────────────────────
const listUpcoming = async (withinHours = 24) => {
  const now = new Date();
  const horizon = new Date(now.getTime() + withinHours * 3_600_000);

  const responses = await prisma.shiftOfferResponse.findMany({
    where: {
      approvalStatus: "APPROVED",
      shiftOffer: { startTime: { gt: now, lte: horizon } },
    },
    orderBy: { shiftOffer: { startTime: "asc" } },
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true } },
      shiftOffer: {
        select: {
          id: true,
          jobTitle: true,
          startTime: true,
          category: { select: { name: true } },
        },
      },
      reminders: { select: { offsetMinutes: true, sentAt: true } },
    },
  });

  return responses.map((r) => {
    const sentMap = new Map(r.reminders.map((x) => [x.offsetMinutes, x.sentAt]));
    return {
      responseId: r.id,
      user: r.user,
      shift: {
        id: r.shiftOffer.id,
        jobTitle: r.shiftOffer.jobTitle,
        category: r.shiftOffer.category.name,
        startTime: r.shiftOffer.startTime,
      },
      reminders: OFFSETS_MIN.map((offset) => ({
        offsetMinutes: offset,
        hoursBefore: offset / 60,
        sent: sentMap.has(offset),
        sentAt: sentMap.get(offset) ?? null,
      })),
    };
  });
};

export const remindersService = { dispatchDueReminders, listUpcoming };

// ─── In-process scheduler (long-lived server only) ───────────────
// Runs the same dispatch on an interval when the app runs as a persistent
// process (npm run dev / self-hosted). It is NOT started on serverless — see
// server.ts, which is the only entry that calls this; vercel.ts never does.
let timer: ReturnType<typeof setInterval> | null = null;

export const startReminderScheduler = (): void => {
  if (!envConfig.REMINDER_INPROCESS_CRON) {
    logger.info("In-process reminder scheduler disabled (REMINDER_INPROCESS_CRON=false).");
    return;
  }
  if (timer) return;

  const run = () => {
    dispatchDueReminders()
      .then((res) => {
        if (res.sent > 0) logger.info(res, "Shift reminders dispatched");
      })
      .catch((err) => logger.error({ err }, "Reminder dispatch failed"));
  };

  timer = setInterval(run, envConfig.REMINDER_INTERVAL_MIN * 60_000);
  if (typeof timer.unref === "function") timer.unref();
  logger.info(
    { intervalMin: envConfig.REMINDER_INTERVAL_MIN },
    "In-process reminder scheduler started"
  );
  run(); // initial pass at boot
};
