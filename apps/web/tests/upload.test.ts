import { describe, expect, it } from "vitest";
import { canonicalHash, configHash, defaultRenderConfig } from "@bonded/shared";

describe("upload deterministic cache key", () => {
  it("has stable hashes", () => {
    const canonical = Buffer.from("canonical-png-bytes");
    expect(canonicalHash(canonical)).toEqual(canonicalHash(Buffer.from("canonical-png-bytes")));
    expect(configHash(defaultRenderConfig)).toEqual(configHash(defaultRenderConfig));
  });
});
