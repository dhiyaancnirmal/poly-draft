import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const DEFAULT_LENGTH = 6

export function generateJoinCode(length = DEFAULT_LENGTH): string {
  if (length <= 0) {
    throw new Error('Join code length must be positive')
  }

  const bytes = crypto.randomBytes(length)
  let code = ''

  for (let i = 0; i < length; i++) {
    const index = bytes[i] % ALPHANUMERIC.length
    code += ALPHANUMERIC[index]
  }

  return code
}

export async function getUniqueJoinCode(
  maxAttempts = 10,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>,
  generator: (len?: number) => string = generateJoinCode
): Promise<string> {
  const supabase = supabaseClient ?? (await createClient())

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generator()
    const { count, error } = await supabase
      .from('leagues')
      .select('id', { head: true, count: 'exact' })
      .eq('join_code', candidate)

    if (error) {
      throw new Error(`Failed to check join code uniqueness: ${error.message}`)
    }

    if (!count || count === 0) {
      return candidate
    }
  }

  throw new Error('Unable to generate a unique join code after multiple attempts')
}

