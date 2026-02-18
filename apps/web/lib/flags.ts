export function isTrue(value: string | undefined): boolean {
  return value === "true";
}

export function isDemoMode(): boolean {
  return isTrue(process.env.NEXT_PUBLIC_DEMO_MODE) || isTrue(process.env.DEMO_MODE);
}

export function isDbDisabled(): boolean {
  return isTrue(process.env.DISABLE_DB) || isDemoMode();
}

export function areJobsDisabled(): boolean {
  return isTrue(process.env.DISABLE_JOBS) || isDemoMode();
}

export function featureDisabledMessage(feature: string): string {
  return `${feature} disabled by feature flag`;
}
