const DAY_MS = 24 * 60 * 60 * 1000

export type Cadence = 'daily' | 'weekly' | 'custom' | null | undefined

export function computePeriodIndex(startTime: string | null, cadence: Cadence, asOf = new Date()): number {
  const start = startTime ? new Date(startTime) : null
  if (!start || Number.isNaN(start.getTime())) return 0

  const lengthDays = cadence === 'weekly' ? 7 : 1
  const lengthMs = lengthDays * DAY_MS

  const delta = asOf.getTime() - start.getTime()
  if (delta <= 0) return 0
  return Math.floor(delta / lengthMs)
}

