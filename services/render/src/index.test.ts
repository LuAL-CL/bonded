import { describe, expect, it, afterAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { canonicalize, processPetPortrait, qualityGate } from "./index";

const OUT_DIR = path.join(process.cwd(), ".tmp-render-test");

/** Genera un PNG RGB sintético del tamaño indicado. */
async function makePng(width: number, height: number, r = 180, g = 130, b = 90): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r, g, b } } })
    .png()
    .toBuffer();
}

afterAll(async () => {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
});

describe("canonicalize", () => {
  it("es determinista con el mismo input", async () => {
    const png = await makePng(64, 64);
    const a = await canonicalize(png);
    const b = await canonicalize(png);
    expect(a.equals(b)).toBe(true);
  });

  it("produce un PNG de salida (no JPEG ni otro)", async () => {
    const png = await makePng(200, 150);
    const out = await canonicalize(png);
    // PNG magic bytes: 89 50 4E 47
    expect(out[0]).toBe(0x89);
    expect(out[1]).toBe(0x50);
    expect(out[2]).toBe(0x4e);
    expect(out[3]).toBe(0x47);
  });

  it("respeta el límite de 1024px", async () => {
    const png = await makePng(2000, 3000);
    const out = await canonicalize(png);
    const meta = await sharp(out).metadata();
    expect(meta.width).toBeLessThanOrEqual(1024);
    expect(meta.height).toBeLessThanOrEqual(1024);
  });
});

describe("qualityGate", () => {
  it("PASS con imagen bien iluminada", async () => {
    const png = await makePng(128, 128, 180, 130, 90); // tono medio
    const canonical = await canonicalize(png);
    const report = await qualityGate(canonical);
    expect(report.status).toBe("PASS");
    expect(report.score).toBeGreaterThan(0);
    expect(report.metrics.brightness).toBeGreaterThan(35);
  });

  it("FAIL con imagen demasiado oscura", async () => {
    const png = await makePng(128, 128, 5, 5, 5); // negro
    const canonical = await canonicalize(png);
    const report = await qualityGate(canonical);
    expect(report.status).toBe("FAIL");
    expect(report.reasons).toContain("too_dark");
  });

  it("FAIL con imagen sobreexpuesta", async () => {
    const png = await makePng(128, 128, 252, 252, 252); // blanco
    const canonical = await canonicalize(png);
    const report = await qualityGate(canonical);
    expect(report.status).toBe("FAIL");
    expect(report.reasons).toContain("overexposed");
  });
});

describe("processPetPortrait", () => {
  it("genera todos los artefactos de debug", async () => {
    const png = await makePng(256, 256, 160, 110, 70);
    const canonical = await canonicalize(png);
    const out = await processPetPortrait(canonical, OUT_DIR, "test-artifacts");

    await expect(fs.access(out.debug.segmentationMaskPath)).resolves.toBeUndefined();
    await expect(fs.access(out.debug.contourPath)).resolves.toBeUndefined();
    await expect(fs.access(out.debug.paletteMapPath)).resolves.toBeUndefined();
    await expect(fs.access(out.debug.regionClassificationPath)).resolves.toBeUndefined();
    await expect(fs.access(out.debug.stitchDirectionMapPath)).resolves.toBeUndefined();
    await expect(fs.access(out.debug.regionManifestPath)).resolves.toBeUndefined();
  });

  it("el manifiesto de regiones es JSON válido con shape correcto", async () => {
    const png = await makePng(256, 256, 160, 110, 70);
    const canonical = await canonicalize(png);
    const out = await processPetPortrait(canonical, OUT_DIR, "test-manifest");

    const raw = await fs.readFile(out.debug.regionManifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    expect(typeof manifest.width).toBe("number");
    expect(typeof manifest.height).toBe("number");
    expect(Array.isArray(manifest.regions)).toBe(true);
  });

  it("el preview es un PNG válido", async () => {
    const png = await makePng(256, 256, 150, 100, 60);
    const canonical = await canonicalize(png);
    const out = await processPetPortrait(canonical, OUT_DIR, "test-preview");

    expect(out.preview[0]).toBe(0x89); // PNG magic
    expect(out.preview[1]).toBe(0x50);
    const meta = await sharp(out.preview).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBeGreaterThan(0);
  });

  it("la paleta contiene strings hex válidos", async () => {
    const png = await makePng(256, 256, 160, 110, 70);
    const canonical = await canonicalize(png);
    const out = await processPetPortrait(canonical, OUT_DIR, "test-palette");

    expect(out.palette.length).toBeGreaterThan(0);
    for (const hex of out.palette) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("el hash es determinista para el mismo canonical", async () => {
    const png = await makePng(128, 128, 150, 100, 60);
    const canonical = await canonicalize(png);
    const a = await processPetPortrait(canonical, OUT_DIR, "test-hash-a");
    const b = await processPetPortrait(canonical, OUT_DIR, "test-hash-b");
    expect(a.hash).toBe(b.hash);
  });
});
