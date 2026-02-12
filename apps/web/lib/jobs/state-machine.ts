import type { QualityReport } from "@bonded/shared";

export function nextOrderStatusAfterRender(report: QualityReport): "NEEDS_REVIEW" | "PAID" {
  return report.status === "PASS" ? "PAID" : "NEEDS_REVIEW";
}

export function nextOrderStatusAfterDigitize(valid: boolean): "ASSETS_GENERATED" | "NEEDS_REVIEW" {
  return valid ? "ASSETS_GENERATED" : "NEEDS_REVIEW";
}
