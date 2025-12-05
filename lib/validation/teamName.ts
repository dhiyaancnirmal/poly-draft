export function validateTeamName(raw: string): { ok: boolean; value?: string; error?: string } {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'Team name is required' }
  if (value.length > 64) return { ok: false, error: 'Team name too long' }
  return { ok: true, value }
}

