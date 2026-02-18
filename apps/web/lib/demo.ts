import { featureDisabledMessage, isDemoMode } from "@/lib/flags";

export { isDemoMode };

export function demoDisabledMessage(feature: string) {
  return featureDisabledMessage(feature);
}
