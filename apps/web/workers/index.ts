import { areJobsDisabled } from "@/lib/flags";

if (areJobsDisabled()) {
  console.log("Workers are disabled by feature flag (DISABLE_JOBS/DEMO_MODE)");
} else {
  await import("./render-worker");
  await import("./digitize-worker");
  await import("./production-pack-worker");
  console.log("All workers started");
}
