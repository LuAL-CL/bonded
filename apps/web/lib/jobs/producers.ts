import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { digitizeQueue, productionPackQueue, renderQueue } from "./queues";
import type { DigitizeJobPayload, ProductionPackJobPayload, RenderJobPayload } from "./types";
import { log } from "./logger";

export async function enqueueRender(payload: Omit<RenderJobPayload, "correlationId"> & { correlationId?: string }) {
  const correlationId = payload.correlationId ?? `ord-${payload.orderId}-cust-${payload.customizationId}-${crypto.randomUUID()}`;
const job = await (renderQueue as any).add("render", { ...payload, correlationId },{ jobId: `${payload.orderId}:${payload.customizationId}:render` });
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
  log("info", "render_enqueued", { order_id: payload.orderId, customization_id: payload.customizationId, job_id: job.id, correlation_id: correlationId });
  return correlationId;
}

export async function enqueueDigitize(payload: DigitizeJobPayload) {
const job = await (digitizeQueue as any).add(
  "digitize",
  payload,
  { jobId: `${payload.orderId}:${payload.customizationId}:digitize` }
);
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
  log("info", "digitize_enqueued", { order_id: payload.orderId, customization_id: payload.customizationId, job_id: job.id, correlation_id: payload.correlationId });
}

export async function enqueueProductionPack(payload: ProductionPackJobPayload) {
const job = await (productionPackQueue as any).add(
  "production-pack",
  payload,
  { jobId: `${payload.orderId}:${payload.customizationId}:pack` }
);
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
  log("info", "pack_enqueued", { order_id: payload.orderId, customization_id: payload.customizationId, job_id: job.id, correlation_id: payload.correlationId });
}
