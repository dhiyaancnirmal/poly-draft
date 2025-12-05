import { strict as assert } from 'node:assert'
import test from 'node:test'
import { calculateLeagueDates, calculateTotalBuyInCents, formatDateOnly } from '@/lib/leagueDates'

test('daily league dates advance to next day and span duration', () => {
  const base = new Date('2025-01-01T12:00:00Z')
  const { startDate, endDate } = calculateLeagueDates('daily', 3, base)

  assert.equal(formatDateOnly(startDate), '2025-01-02')
  assert.equal(formatDateOnly(endDate), '2025-01-04')
})

test('weekly league dates start next Sunday and span full weeks', () => {
  const base = new Date('2025-01-01T12:00:00Z') // Wednesday
  const { startDate, endDate } = calculateLeagueDates('weekly', 2, base)

  assert.equal(formatDateOnly(startDate), '2025-01-05') // Next Sunday
  assert.equal(formatDateOnly(endDate), '2025-01-18') // 14 days span ends on Saturday
})

test('buy-in math uses price per market', () => {
  const total = calculateTotalBuyInCents(3, 5, 100)
  assert.equal(total, 1500)
})

