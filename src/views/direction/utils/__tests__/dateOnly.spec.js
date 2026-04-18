import { describe, expect, it } from 'vitest'
import { getDateOnlyDay, getDateOnlyMonth, getDateOnlyYear, parseDateOnly } from '@/views/direction/utils/dateOnly'

describe('dateOnly helpers', () => {
  it('parses YYYY-MM-DD as a local date-only value', () => {
    const parsed = parseDateOnly('2026-04-01')

    expect(parsed).not.toBeNull()
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(3)
    expect(parsed.getDate()).toBe(1)
  })

  it('returns numeric date parts without timezone drift', () => {
    expect(getDateOnlyYear('2026-04-01')).toBe(2026)
    expect(getDateOnlyMonth('2026-04-01')).toBe(4)
    expect(getDateOnlyDay('2026-04-01')).toBe(1)
  })

  it('rejects non date-only strings', () => {
    expect(parseDateOnly('2026-04-01T00:00:00Z')).toBeNull()
    expect(getDateOnlyMonth('bad')).toBeNull()
  })
})
