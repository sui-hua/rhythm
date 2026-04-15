import { describe, it, expect } from 'vitest'
import { isDailyPlanCompleted, toDailyPlanStatus } from '@/utils/dailyPlanStatus'

describe('isDailyPlanCompleted', () => {
  it('returns true only for status 1', () => {
    expect(isDailyPlanCompleted(1)).toBe(true)
  })

  it('returns false for pending and invalid statuses', () => {
    expect(isDailyPlanCompleted(0)).toBe(false)
    expect(isDailyPlanCompleted(-1)).toBe(false)
    expect(isDailyPlanCompleted(2)).toBe(false)
    expect(isDailyPlanCompleted('0')).toBe(false)
    expect(isDailyPlanCompleted('1')).toBe(false)
    expect(isDailyPlanCompleted('completed')).toBe(false)
    expect(isDailyPlanCompleted(false)).toBe(false)
    expect(isDailyPlanCompleted(true)).toBe(false)
    expect(isDailyPlanCompleted(null)).toBe(false)
    expect(isDailyPlanCompleted(undefined)).toBe(false)
  })

  it('counts completed items consistently for direction sidebar metric', () => {
    const tasks = [{ status: 1 }, { status: 1 }, { status: 0 }, { status: null }]
    const completed = tasks.filter(t => isDailyPlanCompleted(t.status)).length
    expect(completed).toBe(2)
  })
})

describe('toDailyPlanStatus', () => {
  it('maps boolean to DB smallint convention', () => {
    expect(toDailyPlanStatus(true)).toBe(1)
    expect(toDailyPlanStatus(false)).toBe(0)
  })

  it('normalizes truthy and falsy input to 1 and 0', () => {
    expect(toDailyPlanStatus(1)).toBe(1)
    expect(toDailyPlanStatus(0)).toBe(0)
    expect(toDailyPlanStatus(null)).toBe(0)
  })
})
