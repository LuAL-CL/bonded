import { describe, expect, it } from "vitest";
import { nextOrderStatusAfterDigitize, nextOrderStatusAfterRender } from "../../lib/jobs/state-machine";

describe("job orchestration state machine", () => {
  it("routes render PASS to continued pipeline", () => {
    expect(nextOrderStatusAfterRender({ status: "PASS", score: 90, reasons: [], metrics: {} })).toBe("PAID");
  });

  it("routes render FAIL to NEEDS_REVIEW", () => {
    expect(nextOrderStatusAfterRender({ status: "FAIL", score: 10, reasons: ["too_dark"], metrics: {} })).toBe("NEEDS_REVIEW");
  });

  it("routes digitize validity", () => {
    expect(nextOrderStatusAfterDigitize(true)).toBe("ASSETS_GENERATED");
    expect(nextOrderStatusAfterDigitize(false)).toBe("NEEDS_REVIEW");
  });
});
