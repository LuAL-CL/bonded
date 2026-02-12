export const QUEUE_NAMES = {
  render: "render-pipeline",
  digitize: "digitize-pipeline",
  productionPack: "production-pack-pipeline"
} as const;

export type RenderJobPayload = {
  orderId: string;
  customizationId: string;
  canonicalAssetPath: string;
  canonicalHash: string;
  correlationId: string;
};

export type DigitizeJobPayload = {
  orderId: string;
  customizationId: string;
  canonicalHash: string;
  renderPreviewPath: string;
  regionManifestPath: string;
  stitchDirectionMapPath: string;
  correlationId: string;
};

export type ProductionPackJobPayload = {
  orderId: string;
  customizationId: string;
  files: Array<{ path: string; name: string }>;
  correlationId: string;
};
