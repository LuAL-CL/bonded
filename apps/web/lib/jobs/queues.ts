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

// 👇 Detectar si jobs están deshabilitados
const jobsDisabled = process.env.DISABLE_JOBS === "true";

// 👇 Crear queues solo si están habilitados
export const renderQueue = jobsDisabled
  ? null
  : new Queue<RenderJobPayload>(QUEUE_NAMES.render, {
      connection: redisConnection as any,
      defaultJobOptions: baseOptions
    });

export const digitizeQueue = jobsDisabled
  ? null
  : new Queue<DigitizeJobPayload>(QUEUE_NAMES.digitize, {
      connection: redisConnection as any,
      defaultJobOptions: baseOptions
    });

export const productionPackQueue = jobsDisabled
  ? null
  : new Queue<ProductionPackJobPayload>(QUEUE_NAMES.productionPack, {
      connection: redisConnection as any,
      defaultJobOptions: baseOptions
    });
