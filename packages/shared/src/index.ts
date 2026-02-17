import crypto from "crypto";
import stableStringify from "json-stable-stringify";
import { z } from "zod";

export const PIPELINE_VERSION = "1.0.0";

export const renderConfigSchema = z.object({
  maxDimension: z.number().default(1024),
  paletteMaxColors: z.number().max(10).default(10),
  blurThreshold: z.number().default(85),
  minBrightness: z.number().default(35),
  maxBrightness: z.number().default(235),
  minFaceAreaRatio: z.number().default(0.18),
  maxYawAngleDeg: z.number().default(28),
  maxOcclusionRatio: z.number().default(0.22),
  segmentationConfidence: z.number().default(0.6),
  stitch: z.object({
    fillDensityMm: z.number().default(0.4),
    satinDensityMm: z.number().default(0.38),
    pullCompensationMm: z.number().default(0.25),
    maxStitchLengthMm: z.number().default(4),
    maxJumpLengthMm: z.number().default(6),
    trimJumpThresholdMm: z.number().default(4.5)
  })
});

export type RenderConfig = z.infer<typeof renderConfigSchema>;

export const defaultRenderConfig: RenderConfig = renderConfigSchema.parse({});

export function configHash(config: RenderConfig): string {
  const s = stableStringify(config);
  if (s === undefined) {
    // En la práctica no debería pasar con un objeto normal,
    // pero el type lo permite y TS rompe el build.
    throw new Error("stableStringify returned undefined for render config");
  }
  return crypto.createHash("sha256").update(s).digest("hex");
}


export function canonicalHash(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

export type QualityStatus = "PASS" | "FAIL";

export const qualityReportSchema = z.object({
  status: z.enum(["PASS", "FAIL"]),
  score: z.number(),
  reasons: z.array(z.string()),
  metrics: z.record(z.string(), z.number())
});

export type QualityReport = z.infer<typeof qualityReportSchema>;

export const orderStatus = [
  "PAID",
  "ASSETS_GENERATED",
  "NEEDS_REVIEW",
  "IN_PRODUCTION",
  "QC",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "ISSUE_CUSTOMER"
] as const;

export type OrderStatus = (typeof orderStatus)[number];
