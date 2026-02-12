import fs from "fs/promises";
import path from "path";
import { Worker } from "bullmq";
import { processPetPortrait } from "../../../services/render/src/index";
import { prisma } from "@/lib/prisma";
import { redisConnection } from "@/lib/jobs/connection";
import { markJobFailed, markJobRunning, markJobSucceeded } from "@/lib/jobs/job-execution";
import { log } from "@/lib/jobs/logger";
import { enqueueDigitize } from "@/lib/jobs/producers";
import { nextOrderStatusAfterRender } from "@/lib/jobs/state-machine";
import { QUEUE_NAMES, RenderJobPayload } from "@/lib/jobs/types";

const OUT = process.env.LOCAL_ASSET_PATH ?? path.join(process.cwd(), ".artifacts");

new Worker<RenderJobPayload>(
  QUEUE_NAMES.render,
  async (job) => {
    await markJobRunning(job.id!, "RENDER", job.attemptsStarted);
    log("info", "render_started", { order_id: job.data.orderId, customization_id: job.data.customizationId, job_id: job.id, correlation_id: job.data.correlationId });
    try {
      await fs.mkdir(OUT, { recursive: true });
      const canonical = await fs.readFile(job.data.canonicalAssetPath);
      const result = await processPetPortrait(canonical, OUT, `${job.data.canonicalHash}-${job.data.customizationId}`);
      const renderPath = path.join(OUT, `${job.data.canonicalHash}-${job.data.customizationId}-render.png`);
      await fs.writeFile(renderPath, result.preview);

      const nextStatus = nextOrderStatusAfterRender(result.quality);
      await prisma.customization.update({
        where: { id: job.data.customizationId },
        data: {
          patchRenderPngUrl: renderPath,
          qualityReportJson: result.quality,
          paletteJson: result.palette,
          patchRenderSvgUrl: result.debug.regionManifestPath
        }
      });

      await prisma.order.update({ where: { id: job.data.orderId }, data: { status: nextStatus } });

      if (result.quality.status === "PASS") {
        await enqueueDigitize({
          orderId: job.data.orderId,
          customizationId: job.data.customizationId,
          canonicalHash: job.data.canonicalHash,
          renderPreviewPath: renderPath,
          correlationId: job.data.correlationId,
          regionManifestPath: result.debug.regionManifestPath,
          stitchDirectionMapPath: result.debug.stitchDirectionMapPath
        });
      }

      await markJobSucceeded(job.id!, "RENDER");
      log("info", "render_succeeded", {
        order_id: job.data.orderId,
        customization_id: job.data.customizationId,
        job_id: job.id,
        correlation_id: job.data.correlationId,
        status: nextStatus,
        debug_segmentation_mask: result.debug.segmentationMaskPath,
        debug_contour: result.debug.contourPath,
        debug_palette_map: result.debug.paletteMapPath,
        debug_region_classification: result.debug.regionClassificationPath,
        debug_stitch_direction_map: result.debug.stitchDirectionMapPath
      });
    } catch (error) {
      await markJobFailed(job.id!, "RENDER", error, job.attemptsStarted);
      log("error", "render_failed", { order_id: job.data.orderId, customization_id: job.data.customizationId, job_id: job.id, correlation_id: job.data.correlationId, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },
  { connection: redisConnection, concurrency: Number(process.env.RENDER_WORKER_CONCURRENCY ?? 2) }
);
