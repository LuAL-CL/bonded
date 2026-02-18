import path from "path";
import { Worker } from "bullmq";
import { areJobsDisabled, isDbDisabled } from "@/lib/flags";
import { prisma } from "@/lib/prisma";
import { generateProductionPack } from "@/lib/production-pack";
import { getRedisConnection } from "@/lib/jobs/connection";
import { markJobFailed, markJobRunning, markJobSucceeded } from "@/lib/jobs/job-execution";
import { log } from "@/lib/jobs/logger";
import { QUEUE_NAMES, ProductionPackJobPayload } from "@/lib/jobs/types";

const OUT = process.env.LOCAL_ASSET_PATH ?? path.join(process.cwd(), ".artifacts");

if (!areJobsDisabled()) {
  new Worker<ProductionPackJobPayload>(
    QUEUE_NAMES.productionPack,
    async (job) => {
      if (!isDbDisabled()) await markJobRunning(job.id!, "PRODUCTION_PACK", job.attemptsStarted);
      log("info", "production_pack_started", { order_id: job.data.orderId, customization_id: job.data.customizationId, job_id: job.id, correlation_id: job.data.correlationId });

      try {
        const zipPath = path.join(OUT, `${job.data.orderId}-${job.data.customizationId}-production-pack.zip`);
        await generateProductionPack(zipPath, job.data.files);

        if (!isDbDisabled()) {
          await prisma.productionPack.create({ data: { orderId: job.data.orderId, zipUrl: zipPath, version: "1.0.0" } });
          await prisma.order.update({ where: { id: job.data.orderId }, data: { status: "ASSETS_GENERATED" } });
          await markJobSucceeded(job.id!, "PRODUCTION_PACK");
        }

        log("info", "production_pack_succeeded", { order_id: job.data.orderId, customization_id: job.data.customizationId, job_id: job.id, correlation_id: job.data.correlationId });
      } catch (error) {
        if (!isDbDisabled()) {
          await markJobFailed(job.id!, "PRODUCTION_PACK", error, job.attemptsStarted);
          await prisma.order.update({ where: { id: job.data.orderId }, data: { status: "NEEDS_REVIEW" } });
        }
        log("error", "production_pack_failed", { order_id: job.data.orderId, customization_id: job.data.customizationId, job_id: job.id, correlation_id: job.data.correlationId, error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    },
    { connection: getRedisConnection() as any, concurrency: Number(process.env.PRODUCTION_PACK_WORKER_CONCURRENCY ?? 1) }
  );
}
