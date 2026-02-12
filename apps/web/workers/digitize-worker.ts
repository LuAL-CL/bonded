import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { Worker } from "bullmq";
import { prisma } from "@/lib/prisma";
import { redisConnection } from "@/lib/jobs/connection";
import { markJobFailed, markJobRunning, markJobSucceeded } from "@/lib/jobs/job-execution";
import { log } from "@/lib/jobs/logger";
import { enqueueProductionPack } from "@/lib/jobs/producers";
import { nextOrderStatusAfterDigitize } from "@/lib/jobs/state-machine";
import { QUEUE_NAMES, DigitizeJobPayload } from "@/lib/jobs/types";

const OUT = process.env.LOCAL_ASSET_PATH ?? path.join(process.cwd(), ".artifacts");

function runDigitizer(params: {
  manifestPath: string;
  outDst: string;
  outPreviewSvg: string;
  outDirectionJson: string;
  outDirectionPng: string;
  canonicalHash: string;
}) {
  const script = path.join(process.cwd(), "..", "..", "services", "digitize", "src", "digitize.py");
  const py = spawn(
    "python",
    [
      script,
      "--manifest",
      params.manifestPath,
      "--dst",
      params.outDst,
      "--preview-svg",
      params.outPreviewSvg,
      "--direction-json",
      params.outDirectionJson,
      "--direction-png",
      params.outDirectionPng,
      "--canonical-hash",
      params.canonicalHash
    ],
    { env: process.env }
  );

  return new Promise<string>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    py.stdout.on("data", (d) => (stdout += String(d)));
    py.stderr.on("data", (d) => (stderr += String(d)));
    py.on("close", (code) => (code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr || `digitizer exit ${code}`))));
  });
}

new Worker<DigitizeJobPayload>(
  QUEUE_NAMES.digitize,
  async (job) => {
    await markJobRunning(job.id!, "DIGITIZE", job.attemptsStarted);
    log("info", "digitize_started", { order_id: job.data.orderId, customization_id: job.data.customizationId, job_id: job.id, correlation_id: job.data.correlationId });

    try {
      await fs.mkdir(OUT, { recursive: true });
      const dstPath = path.join(OUT, `${job.data.canonicalHash}-${job.data.customizationId}.dst`);
      const previewSvgPath = path.join(OUT, `${job.data.canonicalHash}-${job.data.customizationId}-stitch.svg`);
      const directionJsonPath = path.join(OUT, `${job.data.canonicalHash}-${job.data.customizationId}-digitize-direction-map.json`);
      const directionMapPath = path.join(OUT, `${job.data.canonicalHash}-${job.data.customizationId}-digitize-direction-map.png`);

      const metricsRaw = await runDigitizer({
        manifestPath: job.data.regionManifestPath,
        outDst: dstPath,
        outPreviewSvg: previewSvgPath,
        outDirectionJson: directionJsonPath,
        outDirectionPng: directionMapPath,
        canonicalHash: job.data.canonicalHash
      });
      const metrics = JSON.parse(metricsRaw) as { valid: boolean; stitch_count: number; jump_count: number; trim_count: number; color_changes: number; debug_direction_png?: string | null; };

      await prisma.customization.update({
        where: { id: job.data.customizationId },
        data: {
          embroideryDstUrl: dstPath,
          embroideryPreviewPngUrl: previewSvgPath
        }
      });

      const nextStatus = nextOrderStatusAfterDigitize(metrics.valid);
      await prisma.order.update({ where: { id: job.data.orderId }, data: { status: nextStatus } });

      if (metrics.valid) {
        await enqueueProductionPack({
          orderId: job.data.orderId,
          customizationId: job.data.customizationId,
          correlationId: job.data.correlationId,
          files: [
            { path: job.data.renderPreviewPath, name: "patch-render.png" },
            { path: job.data.regionManifestPath, name: "regions.json" },
            { path: job.data.stitchDirectionMapPath, name: "render-stitch-direction-map.png" },
            { path: directionJsonPath, name: "digitize-stitch-direction-map.json" },
            ...(metrics.debug_direction_png ? [{ path: directionMapPath, name: "digitize-stitch-direction-map.png" }] : []),
            { path: dstPath, name: "embroidery.dst" },
            { path: previewSvgPath, name: "stitch-preview.svg" }
          ]
        });
      }

      await markJobSucceeded(job.id!, "DIGITIZE");
      log("info", "digitize_succeeded", {
        order_id: job.data.orderId,
        customization_id: job.data.customizationId,
        job_id: job.id,
        correlation_id: job.data.correlationId,
        status: nextStatus,
        stitch_count: metrics.stitch_count,
        jump_count: metrics.jump_count,
        trim_count: metrics.trim_count,
        color_changes: metrics.color_changes,
        debug_direction_map: directionMapPath
      });
    } catch (error) {
      await markJobFailed(job.id!, "DIGITIZE", error, job.attemptsStarted);
      await prisma.order.update({ where: { id: job.data.orderId }, data: { status: "NEEDS_REVIEW" } });
      log("error", "digitize_failed", { order_id: job.data.orderId, customization_id: job.data.customizationId, job_id: job.id, correlation_id: job.data.correlationId, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },
  { connection: redisConnection, concurrency: Number(process.env.DIGITIZE_WORKER_CONCURRENCY ?? 2) }
);
