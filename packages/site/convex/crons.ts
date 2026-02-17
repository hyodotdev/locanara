import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Delete orphaned files daily at 2 AM KST (5 PM UTC previous day)
// KST is UTC+9, so 2 AM KST = 17:00 UTC
crons.daily(
  "delete orphaned files",
  { hourUTC: 17, minuteUTC: 0 },
  internal.files.mutation.deleteOrphanedFiles
);

export default crons;
