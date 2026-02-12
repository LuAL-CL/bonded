export function isDemoMode(): boolean {
  const publicFlag = process.env.NEXT_PUBLIC_DEMO_MODE;
  const privateFlag = process.env.DEMO_MODE;
  return publicFlag === "true" || privateFlag === "true";
}

export function demoDisabledMessage(feature: string) {
  return `${feature} disabled in demo`;
}
