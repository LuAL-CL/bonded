import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { digitizeQueue, productionPackQueue, renderQueue } from "./queues";
import type { DigitizeJobPayload, ProductionPackJobPayload, RenderJobPayload } from "./types";
import { log } from "./logger";

export async function enqueueRender(payload: Omit<RenderJobPayload, "correlationId">) {
  const correlationId = `ord-${payload.orderId}-cust-${payload.customizationId}-${crypto.randomUUID()}`;

  // Jobs deshabilitados (ej: Vercel sin Redis)
  if (!renderQueue) {
    log("warn", "render_skipped_jobs_disabled", {
      order_id: payload.orderId,
      customization_id: payload.customizationId,
      correlation_id: correlationId
    });
    return correlationId;
  }

  const jobPayload: RenderJobPayload = {
    ...payload,
    correlationId
  };

  const job = await renderQueue.add("render", jobPayload, {
    jobId: `${payload.orderId}:${payload.customizationId}:render`
  });

  await prisma.jobExecution.upsert({
    where: { queueJobId_jobType: { queueJobId: job.id!, jobType: "RENDER" } },
    update: { status: "QUEUED", payloadJson: jobPayload, correlationId },
    create: {
      queueJobId: job.id!,
      jobType: "RENDER",
      status: "QUEUED",
      orderId: payload.orderId,
      customizationId: payload.customizationId,
      correlationId,
      payloadJson: jobPayload
    }
  });

  log("info", "render_enqueued", {
    order_id: payload.orderId,
    customization_id: payload.customizationId,
    job_id: job.id,
    correlation_id: correlationId
  });

  return correlationId;
}

export async function enqueueDigitize(payload: DigitizeJobPayload) {
  // Jobs deshabilitados (ej: Vercel sin Redis)
  if (!digitizeQueue) {
    log("warn", "digitize_skipped_jobs_disabled", {
      order_id: payload.orderId,
      customization_id: payload.customizationId,
      correlation_id: payload.correlationId
    });
    return;
  }

  const job = await digitizeQueue.add("digitize", payload, {
    jobId: `${payload.orderId}:${payload.customizationId}:digitize`
  });

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

  log("info", "digitize_enqueued", {
    order_id: payload.orderId,
    customization_id: payload.customizationId,
    job_id: job.id,
    correlation_id: payload.correlationId
  });
}

export async function enqueueProductionPack(payload: ProductionPackJobPayload) {
  // Jobs deshabilitados (ej: Vercel sin Redis)
  if (!productionPackQueue) {
    log("warn", "pack_skipped_jobs_disabled", {
      order_id: payload.orderId,
      customization_id: payload.customizationId,
      correlation_id: payload.correlationId
    });
    return;
  }

  const job = await productionPackQueue.add("production-pack", payload, {
    jobId: `${payload.orderId}:${payload.customizationId}:pack`
  });

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

  log("info", "pack_enqueued", {
    order_id: payload.orderId,
    customization_id: payload.customizationId,
    job_id: job.id,
    correlation_id: payload.correlationId
  });
}
