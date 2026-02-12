import { JobsOptions, Queue } from "bullmq";
import { redisConnection } from "./connection";
import { QUEUE_NAMES, RenderJobPayload, DigitizeJobPayload, ProductionPackJobPayload } from "./types";

const baseOptions: JobsOptions = {
  attempts: 4,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
  removeOnFail: { age: 60 * 60 * 24 * 7, count: 5000 }
};

export const renderQueue = new Queue<RenderJobPayload>(QUEUE_NAMES.render, { connection: redisConnection, defaultJobOptions: baseOptions });
export const digitizeQueue = new Queue<DigitizeJobPayload>(QUEUE_NAMES.digitize, { connection: redisConnection, defaultJobOptions: baseOptions });
export const productionPackQueue = new Queue<ProductionPackJobPayload>(QUEUE_NAMES.productionPack, { connection: redisConnection, defaultJobOptions: baseOptions });
