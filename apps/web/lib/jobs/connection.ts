import IORedis from "ioredis";

const jobsDisabled = process.env.DISABLE_JOBS === "true";

export const redisConnection = jobsDisabled
  ? undefined
  : new IORedis(process.env.REDIS_URL ?? "127.0.0.1", {
      maxRetriesPerRequest: null,
    });
