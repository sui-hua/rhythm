import { describe, it, expect } from 'vitest'
import { isGoalDayCompleted, toGoalDayStatus } from '@/utils/goalDayStatus'

describe('isGoalDayCompleted', () => {
  it('returns true only for status 1', () => {
    expect(isGoalDayCompleted(1)).toBe(true)
  })

  it('returns false for pending and invalid statuses', () => {
    expect(isGoalDayCompleted(0)).toBe(false)
    expect(isGoalDayCompleted(-1)).toBe(false)
    expect(isGoalDayCompleted(2)).toBe(false)
    expect(isGoalDayCompleted('0')).toBe(false)
    expect(isGoalDayCompleted('1')).toBe(false)
    expect(isGoalDayCompleted('completed')).toBe(false)
    expect(isGoalDayCompleted(false)).toBe(false)
    expect(isGoalDayCompleted(true)).toBe(false)
    expect(isGoalDayCompleted(null)).toBe(false)
    expect(isGoalDayCompleted(undefined)).toBe(false)
  })

  it('counts completed items consistently for direction sidebar metric', () => {
    const tasks = [{ status: 1 }, { status: 1 }, { status: 0 }, { status: null }]
    const completed = tasks.filter(t => isGoalDayCompleted(t.status)).length
    expect(completed).toBe(2)
  })
})

describe('toGoalDayStatus', () => {
  it('maps boolean to DB smallint convention', () => {
    expect(toGoalDayStatus(true)).toBe(1)
    expect(toGoalDayStatus(false)).toBe(0)
  })

  it('normalizes truthy and falsy input to 1 and 0', () => {
    expect(toGoalDayStatus(1)).toBe(1)
    expect(toGoalDayStatus(0)).toBe(0)
    expect(toGoalDayStatus(null)).toBe(0)
  })
})
