import { describe, expect, it } from "vitest";
import { canonicalHash, configHash, defaultRenderConfig } from "./index";

describe("deterministic hashing", () => {
  it("produces stable config hash", () => {
    const hashA = configHash(defaultRenderConfig);
    const hashB = configHash({ ...defaultRenderConfig });
    expect(hashA).toEqual(hashB);
  });

  it("produces stable canonical hash", () => {
    const sample = Buffer.from("bonded");
    expect(canonicalHash(sample)).toEqual(canonicalHash(Buffer.from("bonded")));
  });
});
