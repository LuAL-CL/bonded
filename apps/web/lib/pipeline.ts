import crypto from "crypto";

export const PIPELINE_VERSION = "1.2.0";

export const defaultRenderConfig = {
  maxDimension: 1024,
  paletteMaxColors: 10,
  blurThreshold: 85,
  minBrightness: 35,
  maxBrightness: 235,
  minFaceAreaRatio: 0.18,
  maxYawAngleDeg: 28,
  maxOcclusionRatio: 0.22,
  segmentationConfidence: 0.6,
  stitch: {
    fillDensityMm: 0.4,
    satinDensityMm: 0.38,
    pullCompensationMm: 0.25,
    maxStitchLengthMm: 4,
    maxJumpLengthMm: 6,
    trimJumpThresholdMm: 4.5
  }
} as const;

export type QualityReport = {
  status: "PASS" | "FAIL";
  score: number;
  reasons: string[];
  metrics: Record<string, number>;
};

export function configHash(config: unknown): string {
  const canonical = JSON.stringify(config, Object.keys(config as Record<string, unknown>).sort());
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

export function canonicalHash(bytes: Buffer): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
