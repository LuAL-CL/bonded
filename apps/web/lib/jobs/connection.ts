import IORedis from "ioredis";

const jobsDisabled = process.env.DISABLE_JOBS === "true";

// When DISABLE_JOBS=true (Vercel / demo mode) no socket is opened.
export const redisConnection: IORedis | undefined = jobsDisabled
  ? undefined
  : new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
      maxRetriesPerRequest: null,
    });
