import { cronJobs } from "convex/server";
import { internal } from "./_generated/api.js";

const crons = cronJobs();

// Schedule a cron to run every day to clean up old, replaced RAG entries.
crons.daily(
  "deleteReplacedRAGEntries",
  { hourUTC: 8, minuteUTC: 0 }, // Run at 8:00 AM UTC
  internal.rag_cleanup.deleteOldContent,
);

export default crons;
