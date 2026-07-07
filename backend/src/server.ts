import { startServer } from "./app";

import { connectToDatabase, prisma } from "./config/db";
import { startReminderScheduler } from "./modules/reminders/reminders.service";


(async () => {
  await connectToDatabase();
  await startServer();
  // Only the long-lived server runs the in-process reminder scheduler; the
  // serverless entry (vercel.ts) never calls this — it uses Vercel Cron.
  startReminderScheduler();
})();
