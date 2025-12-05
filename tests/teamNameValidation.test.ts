import { strict as assert } from 'node:assert'
import test from 'node:test'
import { validateTeamName } from '@/lib/validation/teamName'

test('validateTeamName trims and accepts valid names', () => {
  const res = validateTeamName('  My Squad  ')
  assert.equal(res.ok, true)
  assert.equal(res.value, 'My Squad')
})

test('validateTeamName rejects empty', () => {
  const res = validateTeamName('   ')
  assert.equal(res.ok, false)
})

test('validateTeamName rejects long names', () => {
  const longName = 'x'.repeat(65)
  const res = validateTeamName(longName)
  assert.equal(res.ok, false)
})

