type RouteStat = {
  count: number;
  errorCount: number;
  durations: number[];
};

declare global {
  var __routeStats: Map<string, RouteStat> | undefined;
}

const MAX_SAMPLES = 300;
const LOG_EVERY = 20;

function getStatsStore() {
  if (!global.__routeStats) {
    global.__routeStats = new Map<string, RouteStat>();
  }
  return global.__routeStats;
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

export function recordApiMetric(route: string, durationMs: number, status: number) {
  const store = getStatsStore();
  const current = store.get(route) ?? { count: 0, errorCount: 0, durations: [] };

  current.count += 1;
  if (status >= 400) current.errorCount += 1;
  current.durations.push(durationMs);
  if (current.durations.length > MAX_SAMPLES) current.durations.shift();
  store.set(route, current);

  if (current.count % LOG_EVERY === 0 || status >= 500) {
    const p50 = percentile(current.durations, 50);
    const p95 = percentile(current.durations, 95);
    console.info(
      `[api-metric] route=${route} count=${current.count} errors=${current.errorCount} p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms status=${status}`
    );
  }
}

export function logApiError(route: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[api-error] route=${route} message="${message}"`);
}
