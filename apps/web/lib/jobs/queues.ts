import { JobsOptions, Queue } from "bullmq";
import { areJobsDisabled } from "@/lib/flags";
import { getRedisConnection } from "./connection";
import { QUEUE_NAMES } from "./types";

const baseOptions: JobsOptions = {
  attempts: 4,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
  removeOnFail: { age: 60 * 60 * 24 * 7, count: 5000 }
};

let _renderQueue: Queue | null = null;
let _digitizeQueue: Queue | null = null;
let _productionPackQueue: Queue | null = null;

export function getRenderQueue(): Queue | null {
  if (areJobsDisabled()) return null;
  if (!_renderQueue) _renderQueue = new Queue(QUEUE_NAMES.render, { connection: getRedisConnection() as any, defaultJobOptions: baseOptions });
  return _renderQueue;
}

export function getDigitizeQueue(): Queue | null {
  if (areJobsDisabled()) return null;
  if (!_digitizeQueue) _digitizeQueue = new Queue(QUEUE_NAMES.digitize, { connection: getRedisConnection() as any, defaultJobOptions: baseOptions });
  return _digitizeQueue;
}

export function getProductionPackQueue(): Queue | null {
  if (areJobsDisabled()) return null;
  if (!_productionPackQueue) _productionPackQueue = new Queue(QUEUE_NAMES.productionPack, { connection: getRedisConnection() as any, defaultJobOptions: baseOptions });
  return _productionPackQueue;
}
