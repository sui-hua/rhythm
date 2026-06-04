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
    // 测试边界情况：故意传入非 number 类型，验证运行时健壮性
    // @ts-expect-error 故意传入 string 以测试边界行为
    expect(isGoalDayCompleted('0')).toBe(false)
    // @ts-expect-error 故意传入 string 以测试边界行为
    expect(isGoalDayCompleted('1')).toBe(false)
    // @ts-expect-error 故意传入 string 以测试边界行为
    expect(isGoalDayCompleted('completed')).toBe(false)
    // @ts-expect-error 故意传入 boolean 以测试边界行为
    expect(isGoalDayCompleted(false)).toBe(false)
    // @ts-expect-error 故意传入 boolean 以测试边界行为
    expect(isGoalDayCompleted(true)).toBe(false)
    // @ts-expect-error 故意传入 null 以测试边界行为
    expect(isGoalDayCompleted(null)).toBe(false)
    // @ts-expect-error 故意传入 undefined 以测试边界行为
    expect(isGoalDayCompleted(undefined)).toBe(false)
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
    // @ts-expect-error 故意传入 number 以测试 truthy/falsy 归一化行为
    expect(toGoalDayStatus(1)).toBe(1)
    // @ts-expect-error 故意传入 number 以测试 truthy/falsy 归一化行为
    expect(toGoalDayStatus(0)).toBe(0)
    // @ts-expect-error 故意传入 null 以测试 truthy/falsy 归一化行为
    expect(toGoalDayStatus(null)).toBe(0)
  })
})

