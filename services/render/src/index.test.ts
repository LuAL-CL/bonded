import { describe, expect, it } from "vitest";
import fs from "fs/promises";
import path from "path";
import { canonicalize, processPetPortrait } from "./index";

describe("render pipeline", () => {
  it("canonicalize is deterministic", async () => {
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5Ww5EAAAAASUVORK5CYII=", "base64");
    const a = await canonicalize(png);
    const b = await canonicalize(png);
    expect(a.equals(b)).toBe(true);
  });

  it("produces debug artifacts", async () => {
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAk0lEQVR4nO3PQQ0AIBDAMMC/58MCP7KkVbDX9swZg3cHukCgCgSqQKAKBKpAoAoEqkCgCgSqQKAKBKpAoAoEqkCgCgSqQKAKBKpAoAoEqkCgCgSqQKAKBKpAoAoEqkCgCgSqQKAKBKpAoAoEqkCgCgSqQKAKBKpAoAoEqkCgCgSqQKAKBKpAoAoEqkDgDypgGY2A0j2QAAAABJRU5ErkJggg==", "base64");
    const canonical = await canonicalize(png);
    const outDir = path.join(process.cwd(), ".tmp-render-test");
    const out = await processPetPortrait(canonical, outDir, "test");
    await fs.access(out.debug.segmentationMaskPath);
    await fs.access(out.debug.regionManifestPath);
  });
});
