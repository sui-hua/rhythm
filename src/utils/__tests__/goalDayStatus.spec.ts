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
    // 测试边界情况：传入非 number 类型时函数应返回 false
    expect(isGoalDayCompleted('0' as unknown as number)).toBe(false)
    expect(isGoalDayCompleted('1' as unknown as number)).toBe(false)
    expect(isGoalDayCompleted('completed' as unknown as number)).toBe(false)
    expect(isGoalDayCompleted(false as unknown as number)).toBe(false)
    expect(isGoalDayCompleted(true as unknown as number)).toBe(false)
    expect(isGoalDayCompleted(null as unknown as number)).toBe(false)
    expect(isGoalDayCompleted(undefined as unknown as number)).toBe(false)
  })

  it('counts completed items consistently for direction sidebar metric', () => {
    const tasks: Array<{ status: number | null }> = [
      { status: 1 },
      { status: 1 },
      { status: 0 },
      { status: null }
    ]
    const completed = tasks.filter(t => isGoalDayCompleted(t.status as number)).length
    expect(completed).toBe(2)
  })
})

describe('toGoalDayStatus', () => {
  it('maps boolean to DB smallint convention', () => {
    expect(toGoalDayStatus(true)).toBe(1)
    expect(toGoalDayStatus(false)).toBe(0)
  })

  it('normalizes truthy and falsy input to 1 and 0', () => {
    expect(toGoalDayStatus(1 as unknown as boolean)).toBe(1)
    expect(toGoalDayStatus(0 as unknown as boolean)).toBe(0)
    expect(toGoalDayStatus(null as unknown as boolean)).toBe(0)
  })
})

