import { JobsOptions, Queue } from "bullmq";
import { redisConnection } from "./connection";
import { QUEUE_NAMES, RenderJobPayload, DigitizeJobPayload, ProductionPackJobPayload } from "./types";

const baseOptions: JobsOptions = {
  attempts: 4,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
  removeOnFail: { age: 60 * 60 * 24 * 7, count: 5000 }
};

// 👇 “job maps” (nombre -> payload)
export type RenderJobs = { render: RenderJobPayload };
export type DigitizeJobs = { digitize: DigitizeJobPayload };
export type ProductionPackJobs = { "production-pack": ProductionPackJobPayload };

// 👇 Queue tipada por nombre de job
export const renderQueue = new Queue<RenderJobs>(QUEUE_NAMES.render, {
  connection: redisConnection as any,
  defaultJobOptions: baseOptions
});

export const digitizeQueue = new Queue<DigitizeJobs>(QUEUE_NAMES.digitize, {
  connection: redisConnection as any,
  defaultJobOptions: baseOptions
});

export const productionPackQueue = new Queue<ProductionPackJobs>(QUEUE_NAMES.productionPack, {
  connection: redisConnection as any,
  defaultJobOptions: baseOptions
});
