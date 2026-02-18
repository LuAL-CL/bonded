import IORedis from "ioredis";
import { areJobsDisabled } from "@/lib/flags";

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (areJobsDisabled()) {
    throw new Error("Jobs are disabled by feature flag (DISABLE_JOBS/DEMO_MODE).");
  }
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      enableReadyCheck: true
    });
  }
  return connection;
}
