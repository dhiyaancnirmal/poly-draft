import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const docPath = join(process.cwd(), 'docs', 'SIMULATED_MODE.md')

test('docs describe simulated mode rules (caps, slippage, pricing, scoring)', async () => {
  const content = await readFile(docPath, 'utf8')

  const expectations = [
    'swap cap (3)',
    'required `price`',
    'slippage ±5% vs stored outcome price',
    'check is skipped if no stored price yet',
    'per-period cap',
    'markets_per_period',
    'Gamma-only price refresh',
    'fallback 0.5',
    'mark-to-market: value = YES price, NO (1-price)',
    'cadence',
    'cron',
  ]

  for (const phrase of expectations) {
    assert.ok(
      content.toLowerCase().includes(phrase.toLowerCase()),
      `docs should mention "${phrase}"`
    )
  }
})

