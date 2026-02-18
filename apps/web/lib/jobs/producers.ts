import crypto from "crypto";
import { areJobsDisabled } from "@/lib/flags";
import { isDbDisabled } from "@/lib/flags";
import { prisma } from "@/lib/prisma";
import { getDigitizeQueue, getProductionPackQueue, getRenderQueue } from "./queues";
import type { DigitizeJobPayload, ProductionPackJobPayload, RenderJobPayload } from "./types";
import { log } from "./logger";

export async function enqueueRender(payload: Omit<RenderJobPayload, "correlationId"> & { correlationId?: string }) {
  const correlationId = payload.correlationId ?? `ord-${payload.orderId}-cust-${payload.customizationId}-${crypto.randomUUID()}`;
  if (areJobsDisabled()) {
    log("warn", "render_enqueue_skipped_jobs_disabled", { order_id: payload.orderId, customization_id: payload.customizationId, correlation_id: correlationId });
    return correlationId;
  }

  const queue = getRenderQueue();
  if (!queue) return correlationId;
  const job = await queue.add("render", { ...payload, correlationId }, { jobId: `${payload.orderId}:${payload.customizationId}:render` });

  if (!isDbDisabled()) {
    await prisma.jobExecution.upsert({
      where: { queueJobId_jobType: { queueJobId: job.id!, jobType: "RENDER" } },
      update: { status: "QUEUED", payloadJson: payload, correlationId },
      create: {
        queueJobId: job.id!,
        jobType: "RENDER",
        status: "QUEUED",
        orderId: payload.orderId,
        customizationId: payload.customizationId,
        correlationId,
        payloadJson: payload
      }
    });
  }

  log("info", "render_enqueued", { order_id: payload.orderId, customization_id: payload.customizationId, job_id: job.id, correlation_id: correlationId });
  return correlationId;
}

export async function enqueueDigitize(payload: DigitizeJobPayload) {
  if (areJobsDisabled()) {
    log("warn", "digitize_enqueue_skipped_jobs_disabled", { order_id: payload.orderId, customization_id: payload.customizationId, correlation_id: payload.correlationId });
    return;
  }

  const queue = getDigitizeQueue();
  if (!queue) return;
  const job = await queue.add("digitize", payload, { jobId: `${payload.orderId}:${payload.customizationId}:digitize` });

  if (!isDbDisabled()) {
    await prisma.jobExecution.upsert({
      where: { queueJobId_jobType: { queueJobId: job.id!, jobType: "DIGITIZE" } },
      update: { status: "QUEUED", payloadJson: payload, correlationId: payload.correlationId },
      create: {
        queueJobId: job.id!,
        jobType: "DIGITIZE",
        status: "QUEUED",
        orderId: payload.orderId,
        customizationId: payload.customizationId,
        correlationId: payload.correlationId,
        payloadJson: payload
      }
    });
  }

  log("info", "digitize_enqueued", { order_id: payload.orderId, customization_id: payload.customizationId, job_id: job.id, correlation_id: payload.correlationId });
}

export async function enqueueProductionPack(payload: ProductionPackJobPayload) {
  if (areJobsDisabled()) {
    log("warn", "pack_enqueue_skipped_jobs_disabled", { order_id: payload.orderId, customization_id: payload.customizationId, correlation_id: payload.correlationId });
    return;
  }

  const queue = getProductionPackQueue();
  if (!queue) return;
  const job = await queue.add("production-pack", payload, { jobId: `${payload.orderId}:${payload.customizationId}:pack` });

  if (!isDbDisabled()) {
    await prisma.jobExecution.upsert({
      where: { queueJobId_jobType: { queueJobId: job.id!, jobType: "PRODUCTION_PACK" } },
      update: { status: "QUEUED", payloadJson: payload, correlationId: payload.correlationId },
      create: {
        queueJobId: job.id!,
        jobType: "PRODUCTION_PACK",
        status: "QUEUED",
        orderId: payload.orderId,
        customizationId: payload.customizationId,
        correlationId: payload.correlationId,
        payloadJson: payload
      }
    });
  }

  log("info", "pack_enqueued", { order_id: payload.orderId, customization_id: payload.customizationId, job_id: job.id, correlation_id: payload.correlationId });
}
