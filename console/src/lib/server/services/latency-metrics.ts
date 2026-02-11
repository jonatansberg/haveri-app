export function startLatencyTimer(): number {
  return Date.now();
}

export function logLatencyMetric(input: {
  metric: string;
  startedAt: number;
  context?: Record<string, unknown>;
}): void {
  const durationMs = Date.now() - input.startedAt;
  console.info('Latency metric', {
    metric: input.metric,
    durationMs,
    ...(input.context ?? {})
  });
}
