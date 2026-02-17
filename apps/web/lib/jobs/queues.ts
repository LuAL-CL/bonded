import { JobsOptions, Queue } from "bullmq";
import { redisConnection } from "./connection";
import { QUEUE_NAMES, RenderJobPayload, DigitizeJobPayload, ProductionPackJobPayload } from "./types";

const baseOptions: JobsOptions = {
  attempts: 4,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
  removeOnFail: { age: 60 * 60 * 24 * 7, count: 5000 }
};

// 👇 Jobs map: nombre de job -> payload
type RenderJobs = { render: RenderJobPayload };
type DigitizeJobs = { digitize: DigitizeJobPayload };
type ProductionPackJobs = { "production-pack": ProductionPackJobPayload };

export const renderQueue = new Queue<RenderJobs>(QUEUE_NAMES.render, {
  connection: redisConnection,
  defaultJobOptions: baseOptions
});

export const digitizeQueue = new Queue<DigitizeJobs>(QUEUE_NAMES.digitize, {
  connection: redisConnection,
  defaultJobOptions: baseOptions
});

export const productionPackQueue = new Queue<ProductionPackJobs>(QUEUE_NAMES.productionPack, {
  connection: redisConnection,
  defaultJobOptions: baseOptions
});

