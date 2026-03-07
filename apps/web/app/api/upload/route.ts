import os from "os";
import path from "path";
import { canonicalHash, configHash, defaultRenderConfig, PIPELINE_VERSION } from "@bonded/shared";
import { canonicalize, processPetPortrait } from "@bonded/render-worker";

const TMP_DIR = path.join(os.tmpdir(), "bonded-renders");

export async function POST(req: Request) {
  const bytes = Buffer.from(await req.arrayBuffer());

  let canonical: Buffer;
  try {
    canonical = await canonicalize(bytes);
  } catch {
    return Response.json({ error: "Imagen inválida o formato no soportado." }, { status: 400 });
  }

  const cHash = canonicalHash(canonical);
  const cfgHash = configHash(defaultRenderConfig);

  let result;
  try {
    result = await processPetPortrait(canonical, TMP_DIR, cHash.slice(0, 16));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Error en el pipeline de render: ${msg}` }, { status: 500 });
  }

  return Response.json({
    canonical_hash: cHash,
    config_hash: cfgHash,
    pipeline_version: PIPELINE_VERSION,
    quality: result.quality,
    palette: result.palette,
    preview_base64: `data:image/png;base64,${result.preview.toString("base64")}`,
  });
}
