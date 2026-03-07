/**
 * Test de integración: pipeline render → digitize end-to-end.
 * No requiere Redis ni DB — invoca los servicios directamente.
 */
import { describe, it, expect, afterAll } from "vitest";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { canonicalize, processPetPortrait } from "./index";

const OUT_DIR = path.join(process.cwd(), ".tmp-integration-test");
const DIGITIZE_SCRIPT = path.join(process.cwd(), "..", "digitize", "src", "digitize.py");

afterAll(async () => {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
});

async function makePng(w: number, h: number, r = 160, g = 110, b = 70): Promise<Buffer> {
  return sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } })
    .png()
    .toBuffer();
}

function runDigitize(args: {
  manifest: string;
  dst: string;
  previewSvg: string;
  directionJson: string;
  directionPng: string;
  canonicalHash: string;
}): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", [
      DIGITIZE_SCRIPT,
      "--manifest", args.manifest,
      "--dst", args.dst,
      "--preview-svg", args.previewSvg,
      "--direction-json", args.directionJson,
      "--direction-png", args.directionPng,
      "--canonical-hash", args.canonicalHash,
    ]);
    let stdout = "";
    let stderr = "";
    py.stdout.on("data", (d: Buffer) => (stdout += String(d)));
    py.stderr.on("data", (d: Buffer) => (stderr += String(d)));
    py.on("close", (code) => {
      if (code !== 0) return reject(new Error(`digitize exit ${code}: ${stderr}`));
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        reject(new Error(`JSON inválido de digitize: ${stdout}`));
      }
    });
  });
}

describe("pipeline render → digitize", () => {
  it("render produce manifiesto de regiones legible por digitize", async () => {
    await fs.mkdir(OUT_DIR, { recursive: true });
    const png = await makePng(256, 256, 160, 110, 70);
    const canonical = await canonicalize(png);
    const render = await processPetPortrait(canonical, OUT_DIR, "e2e");

    // El manifiesto existe y tiene regiones
    const raw = await fs.readFile(render.debug.regionManifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    expect(manifest.regions.length).toBeGreaterThan(0);
  });

  it("digitize acepta el manifiesto y produce DST + SVG + métricas", async () => {
    await fs.mkdir(OUT_DIR, { recursive: true });
    const png = await makePng(256, 256, 160, 110, 70);
    const canonical = await canonicalize(png);
    const render = await processPetPortrait(canonical, OUT_DIR, "e2e-dst");

    const dst     = path.join(OUT_DIR, "e2e.dst");
    const svg     = path.join(OUT_DIR, "e2e-stitch.svg");
    const dirJson = path.join(OUT_DIR, "e2e-direction.json");
    const dirPng  = path.join(OUT_DIR, "e2e-direction.png");

    const metrics = await runDigitize({
      manifest: render.debug.regionManifestPath,
      dst,
      previewSvg: svg,
      directionJson: dirJson,
      directionPng: dirPng,
      canonicalHash: render.hash,
    });

    // Archivos generados
    await expect(fs.access(dst)).resolves.toBeUndefined();
    await expect(fs.access(svg)).resolves.toBeUndefined();
    await expect(fs.access(dirJson)).resolves.toBeUndefined();

    // Métricas válidas
    expect(metrics.valid).toBe(true);
    expect(typeof metrics.stitch_count).toBe("number");
    expect(typeof metrics.jump_count).toBe("number");
    expect(typeof metrics.color_changes).toBe("number");
    expect((metrics.stitch_count as number)).toBeGreaterThan(0);
  });

  it("el hash del render es determinista (misma foto → mismo DST)", async () => {
    await fs.mkdir(OUT_DIR, { recursive: true });
    const png = await makePng(128, 128, 150, 100, 60);
    const canonical = await canonicalize(png);

    const r1 = await processPetPortrait(canonical, OUT_DIR, "det-1");
    const r2 = await processPetPortrait(canonical, OUT_DIR, "det-2");
    expect(r1.hash).toBe(r2.hash);

    // El mismo canonical hash implica el mismo DST
    const d1 = path.join(OUT_DIR, "det-1.dst");
    const d2 = path.join(OUT_DIR, "det-2.dst");
    for (const [render, dst] of [[r1, d1], [r2, d2]] as const) {
      await runDigitize({
        manifest: render.debug.regionManifestPath,
        dst,
        previewSvg: dst.replace(".dst", ".svg"),
        directionJson: dst.replace(".dst", "-dir.json"),
        directionPng: dst.replace(".dst", "-dir.png"),
        canonicalHash: render.hash,
      });
    }
    const [buf1, buf2] = await Promise.all([fs.readFile(d1), fs.readFile(d2)]);
    expect(buf1.equals(buf2)).toBe(true);
  });
});
