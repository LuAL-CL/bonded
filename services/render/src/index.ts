import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { canonicalHash, defaultRenderConfig, QualityReport } from "@bonded/shared";

type RGB = { r: number; g: number; b: number };

type BoundingBox = { x0: number; y0: number; x1: number; y1: number };

type RegionManifest = {
  id: string;
  colorHex: string;
  regionType: "fill" | "feature" | "outline";
  angleDeg: number;
  points: Array<[number, number]>;
};

export type RenderDebugOutputs = {
  segmentationMaskPath: string;
  contourPath: string;
  paletteMapPath: string;
  regionClassificationPath: string;
  stitchDirectionMapPath: string;
  regionManifestPath: string;
};

export type RenderPipelineOutput = {
  hash: string;
  preview: Buffer;
  quality: QualityReport;
  palette: string[];
  debug: RenderDebugOutputs;
};

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rgbToHex(c: RGB): string {
  return `#${[c.r, c.g, c.b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

function computeBackgroundMean(raw: Buffer, width: number, height: number): RGB {
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1]
  ];
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (const [x, y] of corners) {
    const idx = (y * width + x) * 3;
    r += raw[idx];
    g += raw[idx + 1];
    b += raw[idx + 2];
    count += 1;
  }
  return { r: r / count, g: g / count, b: b / count };
}

function detectPetMask(raw: Buffer, width: number, height: number): Uint8Array {
  const bg = computeBackgroundMean(raw, width, height);
  const mask = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = (y * width + x) * 3;
      const r = raw[idx];
      const g = raw[idx + 1];
      const b = raw[idx + 2];
      const colorDist = Math.sqrt((r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2);

      const li = luminance(r, g, b);
      const lx = luminance(raw[idx - 3], raw[idx - 2], raw[idx - 1]);
      const rx = luminance(raw[idx + 3], raw[idx + 4], raw[idx + 5]);
      const uy = luminance(raw[idx - width * 3], raw[idx - width * 3 + 1], raw[idx - width * 3 + 2]);
      const dy = luminance(raw[idx + width * 3], raw[idx + width * 3 + 1], raw[idx + width * 3 + 2]);
      const edge = Math.abs(rx - lx) + Math.abs(dy - uy);

      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      const score = colorDist * 0.55 + edge * 0.35 + sat * 0.1;
      mask[y * width + x] = score > 45 ? 255 : 0;
    }
  }
  return morphologicalClose(mask, width, height);
}

function morphologicalClose(mask: Uint8Array, width: number, height: number): Uint8Array {
  const dilated = new Uint8Array(mask.length);
  const out = new Uint8Array(mask.length);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let hit = 0;
      for (let j = -1; j <= 1; j += 1) {
        for (let i = -1; i <= 1; i += 1) {
          if (mask[(y + j) * width + (x + i)] > 0) hit = 255;
        }
      }
      dilated[y * width + x] = hit;
    }
  }
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      let ok = 255;
      for (let j = -1; j <= 1; j += 1) {
        for (let i = -1; i <= 1; i += 1) {
          if (dilated[(y + j) * width + (x + i)] === 0) ok = 0;
        }
      }
      out[y * width + x] = ok;
    }
  }
  return out;
}

function bboxFromMask(mask: Uint8Array, width: number, height: number): BoundingBox {
  let x0 = width;
  let y0 = height;
  let x1 = 0;
  let y1 = 0;
  let found = false;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (mask[y * width + x] > 0) {
        found = true;
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
  }
  if (!found) return { x0: Math.floor(width * 0.2), y0: Math.floor(height * 0.2), x1: Math.floor(width * 0.8), y1: Math.floor(height * 0.8) };
  const padX = Math.floor((x1 - x0) * 0.12);
  const padY = Math.floor((y1 - y0) * 0.18);
  return {
    x0: clamp(x0 - padX, 0, width - 1),
    y0: clamp(y0 - padY, 0, height - 1),
    x1: clamp(x1 + padX, 1, width - 1),
    y1: clamp(y1 + padY, 1, height - 1)
  };
}

function reducePalette(raw: Buffer, mask: Uint8Array, width: number, height: number, maxColors: number): { indexed: Uint8Array; palette: RGB[] } {
  // preserve identity anchors (eyes/nose/high-contrast markings) by always seeding darkest and brightest pet tones
  const samples: RGB[] = [];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (mask[y * width + x] === 0) continue;
      const idx = (y * width + x) * 3;
      samples.push({ r: raw[idx], g: raw[idx + 1], b: raw[idx + 2] });
    }
  }
  const seeds: RGB[] = [];
  if (samples.length > 0) {
    const byLum = [...samples].sort((a, b) => luminance(a.r, a.g, a.b) - luminance(b.r, b.g, b.b));
    seeds.push({ ...byLum[0] });
    seeds.push({ ...byLum[Math.floor(byLum.length * 0.9)] });
  }
  for (const c of samples) {
    if (seeds.length >= maxColors) break;
    seeds.push({ ...c });
  }
  while (seeds.length < maxColors) seeds.push({ r: 120, g: 90, b: 70 });

  for (let iter = 0; iter < 7; iter += 1) {
    const sums = seeds.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (const s of samples) {
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let k = 0; k < seeds.length; k += 1) {
        const d = (s.r - seeds[k].r) ** 2 + (s.g - seeds[k].g) ** 2 + (s.b - seeds[k].b) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = k;
        }
      }
      sums[best].r += s.r;
      sums[best].g += s.g;
      sums[best].b += s.b;
      sums[best].n += 1;
    }
    for (let k = 0; k < seeds.length; k += 1) {
      if (sums[k].n === 0) continue;
      seeds[k] = {
        r: Math.round(sums[k].r / sums[k].n),
        g: Math.round(sums[k].g / sums[k].n),
        b: Math.round(sums[k].b / sums[k].n)
      };
    }
  }

  const indexed = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const m = mask[y * width + x];
      if (m === 0) {
        indexed[y * width + x] = 0;
        continue;
      }
      const idx = (y * width + x) * 3;
      const p = { r: raw[idx], g: raw[idx + 1], b: raw[idx + 2] };
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let k = 0; k < seeds.length; k += 1) {
        const d = (p.r - seeds[k].r) ** 2 + (p.g - seeds[k].g) ** 2 + (p.b - seeds[k].b) ** 2;
        if (d < bestDist) {
          bestDist = d;
          best = k;
        }
      }
      indexed[y * width + x] = best;
    }
  }
  return { indexed, palette: seeds.slice(0, maxColors) };
}

function classifyRegions(indexed: Uint8Array, palette: RGB[], width: number, height: number): RegionManifest[] {
  const regions: RegionManifest[] = [];
  for (let k = 0; k < palette.length; k += 1) {
    let count = 0;
    let xMin = width;
    let yMin = height;
    let xMax = 0;
    let yMax = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (indexed[y * width + x] !== k) continue;
        count += 1;
        xMin = Math.min(xMin, x);
        yMin = Math.min(yMin, y);
        xMax = Math.max(xMax, x);
        yMax = Math.max(yMax, y);
      }
    }
    if (count < 200) continue;
    const areaRatio = count / (width * height);
    const regionType: RegionManifest["regionType"] = areaRatio > 0.12 ? "fill" : areaRatio > 0.03 ? "outline" : "feature";
    regions.push({
      id: `region-${k}`,
      colorHex: rgbToHex(palette[k]),
      regionType,
      angleDeg: (k * 27) % 180,
      points: [
        [xMin, yMin],
        [xMax, yMin],
        [xMax, yMax],
        [xMin, yMax]
      ]
    });
  }
  return regions;
}

async function writeGrayPng(data: Uint8Array, width: number, height: number, outputPath: string) {
  await sharp(Buffer.from(data), { raw: { width, height, channels: 1 } }).png().toFile(outputPath);
}

async function writeRgbPng(data: Uint8Array, width: number, height: number, outputPath: string) {
  await sharp(Buffer.from(data), { raw: { width, height, channels: 3 } }).png().toFile(outputPath);
}

function makePaletteMap(indexed: Uint8Array, palette: RGB[], width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const c = palette[indexed[idx]] ?? { r: 250, g: 245, b: 235 };
      out[idx * 3] = c.r;
      out[idx * 3 + 1] = c.g;
      out[idx * 3 + 2] = c.b;
    }
  }
  return out;
}

function makeContour(mask: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const c = mask[y * width + x];
      if (!c) continue;
      const n = mask[(y - 1) * width + x] * mask[(y + 1) * width + x] * mask[y * width + x - 1] * mask[y * width + x + 1];
      out[y * width + x] = n ? 0 : 255;
    }
  }
  return out;
}

function makeRegionClassificationMap(indexed: Uint8Array, regions: RegionManifest[], width: number, height: number): Uint8Array {
  const map = new Map<string, number>();
  regions.forEach((r) => map.set(r.id, r.regionType === "fill" ? 0 : r.regionType === "outline" ? 1 : 2));
  const out = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const region = regions.find((r) => r.id === `region-${indexed[idx]}`);
      const cls = region ? map.get(region.id) ?? 0 : 0;
      const base = idx * 3;
      if (cls === 0) {
        out[base] = 156; out[base + 1] = 107; out[base + 2] = 74;
      } else if (cls === 1) {
        out[base] = 63; out[base + 1] = 63; out[base + 2] = 70;
      } else {
        out[base] = 17; out[base + 1] = 94; out[base + 2] = 89;
      }
    }
  }
  return out;
}

function makeStitchDirectionMap(regions: RegionManifest[], width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height * 3);
  out.fill(238);
  for (const r of regions) {
    const [[x0, y0], [x1], [, y1]] = r.points;
    const rad = (r.angleDeg * Math.PI) / 180;
    const vx = Math.cos(rad);
    const vy = Math.sin(rad);
    for (let y = y0; y <= y1; y += 8) {
      for (let x = x0; x <= x1; x += 8) {
        for (let t = 0; t < 6; t += 1) {
          const px = clamp(Math.round(x + vx * t), 0, width - 1);
          const py = clamp(Math.round(y + vy * t), 0, height - 1);
          const idx = (py * width + px) * 3;
          out[idx] = 41;
          out[idx + 1] = 37;
          out[idx + 2] = 36;
        }
      }
    }
  }
  return out;
}

export async function canonicalize(input: Buffer): Promise<Buffer> {
  return sharp(input).rotate().resize({ width: 1024, height: 1024, fit: "inside" }).png().toBuffer();
}

export async function qualityGate(canonical: Buffer): Promise<QualityReport> {
  const stats = await sharp(canonical).stats();
  const brightness = stats.channels.reduce((s, c) => s + c.mean, 0) / 3;
  const reasons: string[] = [];
  if (brightness < defaultRenderConfig.minBrightness) reasons.push("too_dark");
  if (brightness > defaultRenderConfig.maxBrightness) reasons.push("overexposed");
  return {
    status: reasons.length ? "FAIL" : "PASS",
    score: Math.max(0, 100 - reasons.length * 25),
    reasons,
    metrics: { brightness }
  };
}

function embroideryTextureSvg(width: number, height: number): Buffer {
  const stripes: string[] = [];
  for (let i = -height; i < width + height; i += 8) {
    stripes.push(`<line x1='${i}' y1='0' x2='${i - height}' y2='${height}' stroke='rgba(255,255,255,0.08)' stroke-width='2'/>`);
  }
  return Buffer.from(`<svg width='${width}' height='${height}'><rect width='100%' height='100%' fill='transparent'/>${stripes.join("")}</svg>`);
}

export async function processPetPortrait(canonical: Buffer, outputDir: string, prefix: string): Promise<RenderPipelineOutput> {
  await fs.mkdir(outputDir, { recursive: true });
  const image = sharp(canonical);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const mask = detectPetMask(data, info.width, info.height);
  const contour = makeContour(mask, info.width, info.height);
  const bbox = bboxFromMask(mask, info.width, info.height);

  const cropW = bbox.x1 - bbox.x0;
  const cropH = bbox.y1 - bbox.y0;
  const cropped = await sharp(canonical).extract({ left: bbox.x0, top: bbox.y0, width: cropW, height: cropH }).resize(1024, 1024, { fit: "cover" }).png().toBuffer();

  const quality = await qualityGate(cropped);
  const { data: cData, info: cInfo } = await sharp(cropped).raw().toBuffer({ resolveWithObject: true });
  const cMask = detectPetMask(cData, cInfo.width, cInfo.height);
  const petPaletteLimit = 8;
  const { indexed, palette } = reducePalette(cData, cMask, cInfo.width, cInfo.height, petPaletteLimit);
  const paletteMap = makePaletteMap(indexed, palette, cInfo.width, cInfo.height);
  const regions = classifyRegions(indexed, palette, cInfo.width, cInfo.height);
  const clsMap = makeRegionClassificationMap(indexed, regions, cInfo.width, cInfo.height);
  const dirMap = makeStitchDirectionMap(regions, cInfo.width, cInfo.height);

  const segmentationMaskPath = path.join(outputDir, `${prefix}-segmentation-mask.png`);
  const contourPath = path.join(outputDir, `${prefix}-contour.png`);
  const paletteMapPath = path.join(outputDir, `${prefix}-palette-map.png`);
  const regionClassificationPath = path.join(outputDir, `${prefix}-region-classification.png`);
  const stitchDirectionMapPath = path.join(outputDir, `${prefix}-stitch-direction-map.png`);
  const regionManifestPath = path.join(outputDir, `${prefix}-regions.json`);

  await writeGrayPng(cMask, cInfo.width, cInfo.height, segmentationMaskPath);
  await writeGrayPng(contour, info.width, info.height, contourPath);
  await writeRgbPng(paletteMap, cInfo.width, cInfo.height, paletteMapPath);
  await writeRgbPng(clsMap, cInfo.width, cInfo.height, regionClassificationPath);
  await writeRgbPng(dirMap, cInfo.width, cInfo.height, stitchDirectionMapPath);
  await fs.writeFile(regionManifestPath, JSON.stringify({ width: cInfo.width, height: cInfo.height, regions }, null, 2));

  const threadTexture = embroideryTextureSvg(1024, 1024);
  const frame = Buffer.from(`<svg width='1024' height='1024'><polygon points='512,120 900,512 512,900 120,512' fill='none' stroke='#3b2f2f' stroke-width='18'/></svg>`);
  const palettePreview = await sharp(Buffer.from(paletteMap), { raw: { width: cInfo.width, height: cInfo.height, channels: 3 } }).png().toBuffer();
  const preview = await sharp(palettePreview).composite([{ input: threadTexture }, { input: frame }]).png().toBuffer();

  return {
    hash: canonicalHash(cropped),
    preview,
    quality,
    palette: palette.map(rgbToHex),
    debug: {
      segmentationMaskPath,
      contourPath,
      paletteMapPath,
      regionClassificationPath,
      stitchDirectionMapPath,
      regionManifestPath
    }
  };
}
