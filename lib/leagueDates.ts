export type LeagueType = 'daily' | 'weekly'

export function getNextDailyStartDate(base = new Date()): Date {
  const start = new Date(base)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() + 1)
  return start
}

export function getNextSunday(base = new Date()): Date {
  const start = new Date(base)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const offset = day === 0 ? 7 : 7 - day
  start.setDate(start.getDate() + offset)
  return start
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function calculateLeagueDates(type: LeagueType, durationPeriods: number, now = new Date()) {
  const startDate = type === 'daily' ? getNextDailyStartDate(now) : getNextSunday(now)
  const periodLengthDays = type === 'daily' ? 1 : 7
  const endDate = addDays(startDate, periodLengthDays * durationPeriods - 1)

  return { startDate, endDate }
}

export function calculateTotalBuyInCents(picksPerPeriod: number, durationPeriods: number, pricePerMarketCents: number) {
  return picksPerPeriod * durationPeriods * pricePerMarketCents
}

