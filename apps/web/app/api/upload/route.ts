import { canonicalHash, configHash, defaultRenderConfig, PIPELINE_VERSION } from "@/lib/pipeline";
import sharp from "sharp";

export async function POST(req: Request) {
  const bytes = Buffer.from(await req.arrayBuffer());
  const canonical = await sharp(bytes).rotate().resize({ width: 1024, height: 1024, fit: "inside" }).png().toBuffer();
  const cHash = canonicalHash(canonical);
  const cfgHash = configHash(defaultRenderConfig);

  return Response.json({
    message: "Upload recibido. Pipeline deterministic cache key calculada.",
    canonical_hash: cHash,
    config_hash: cfgHash,
    pipeline_version: PIPELINE_VERSION
  });
}
