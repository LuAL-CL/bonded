import { JobsOptions, Queue } from "bullmq";
import { redisConnection } from "./connection";
import {
  QUEUE_NAMES,
  RenderJobPayload,
  DigitizeJobPayload,
  ProductionPackJobPayload,
} from "./types";

const baseOptions: JobsOptions = {
  attempts: 4,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
  removeOnFail: { age: 60 * 60 * 24 * 7, count: 5000 },
};

// BullMQ espera que el genérico sea un "jobs map" (name -> payload)
type RenderJobs = { render: RenderJobPayload };
type DigitizeJobs = { digitize: DigitizeJobPayload };
type ProductionPackJobs = { "production-pack": ProductionPackJobPayload };

// OJO: los strings ("render", "digitize", "production-pack") deben coincidir
// con los que usas en producers.ts al hacer queue.add("<name>", payload)
export const renderQueue = new Queue<RenderJobs>(QUEUE_NAMES.render, {
  connection: redisConnection,
  defaultJobOptions: baseOptions,
});

export const digitizeQueue = new Queue<DigitizeJobs>(QUEUE_NAMES.digitize, {
  connection: redisConnection,
  defaultJobOptions: baseOptions,
});

export const productionPackQueue = new Queue<ProductionPackJobs>(
  QUEUE_NAMES.productionPack,
  {
    connection: redisConnection,
    defaultJobOptions: baseOptions,
  }
);
