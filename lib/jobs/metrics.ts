export type JobMetric = {
  name: string
  success: boolean
  durationMs: number
  at: string
  error?: string
  stats?: Record<string, any>
}

type MetricStore = {
  metrics: JobMetric[]
}

function getStore(): MetricStore {
  const g = globalThis as any
  if (!g.__jobMetrics) {
    g.__jobMetrics = { metrics: [] } as MetricStore
  }
  return g.__jobMetrics as MetricStore
}

export function recordJobMetric(entry: JobMetric) {
  const store = getStore()
  store.metrics.unshift(entry)
  // keep the list short to avoid unbounded memory usage
  if (store.metrics.length > 50) {
    store.metrics.length = 50
  }
}

export function getJobMetrics(name?: string): JobMetric[] {
  const store = getStore()
  if (!name) return [...store.metrics]
  return store.metrics.filter((m) => m.name === name)
}

export function getJobSummary() {
  const store = getStore()
  const latestByJob: Record<
    string,
    {
      lastRun?: string
      lastSuccess?: string
      lastDurationMs?: number
      lastError?: string
    }
  > = {}

  for (const metric of store.metrics) {
    const existing = latestByJob[metric.name]
    if (!existing) {
      latestByJob[metric.name] = {
        lastRun: metric.at,
        lastSuccess: metric.success ? metric.at : undefined,
        lastDurationMs: metric.durationMs,
        lastError: metric.success ? undefined : metric.error,
      }
      continue
    }
    if (!existing.lastRun) {
      existing.lastRun = metric.at
    }
    if (metric.success && !existing.lastSuccess) {
      existing.lastSuccess = metric.at
    }
    if (!existing.lastDurationMs) {
      existing.lastDurationMs = metric.durationMs
    }
    if (!metric.success && !existing.lastError) {
      existing.lastError = metric.error
    }
  }

  return latestByJob
}

