import { strict as assert } from 'node:assert'
import test from 'node:test'
import { generateJoinCode, getUniqueJoinCode } from '@/lib/leagueCodes'

test('generateJoinCode returns uppercase alphanumeric of given length', () => {
  const code = generateJoinCode(8)
  assert.equal(code.length, 8)
  assert.ok(/^[A-Z0-9]+$/.test(code))
})

test('getUniqueJoinCode retries when candidate exists', async () => {
  const attempted: string[] = []
  const generator = () => {
    const pool = ['DUPLIC', 'UNIQUE1']
    const value = pool[attempted.length] ?? 'FALLBACK'
    attempted.push(value)
    return value
  }

  const supabaseMock = {
    from() {
      return {
        select() {
          return {
            eq: async (_column: string, value: string) => ({
              count: value === 'DUPLIC' ? 1 : 0,
              error: null,
            }),
          }
        },
      }
    },
  }

  const code = await getUniqueJoinCode(5, supabaseMock as any, generator)
  assert.equal(code, 'UNIQUE1')
  assert.deepEqual(attempted, ['DUPLIC', 'UNIQUE1'])
})

