type LogLevel = "info" | "error" | "warn";

export function log(level: LogLevel, message: string, context: Record<string, unknown>) {
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...context
  };
  const str = JSON.stringify(line);
  if (level === "error") {
    console.error(str);
    return;
  }
  if (level === "warn") {
    console.warn(str);
    return;
  }
  console.log(str);
}
