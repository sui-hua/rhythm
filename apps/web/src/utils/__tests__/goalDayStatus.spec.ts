import { describe, it, expect } from 'vitest'
import { isGoalDayCompleted, toGoalDayStatus } from '@/utils/goalDayStatus'

describe('isGoalDayCompleted', () => {
  it('returns true only for status completed', () => {
    expect(isGoalDayCompleted('completed')).toBe(true)
  })

  it('returns false for active and archived statuses', () => {
    expect(isGoalDayCompleted('active')).toBe(false)
    expect(isGoalDayCompleted('archived')).toBe(false)
    // 测试边界情况：故意传非字符串类型，验证运行时健壮性
    // @ts-expect-error 故意传入 number 以测试边界行为
    expect(isGoalDayCompleted(0)).toBe(false)
    // @ts-expect-error 故意传入 number 以测试边界行为
    expect(isGoalDayCompleted(1)).toBe(false)
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
    const tasks: Array<{ status: string | null }> = [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'active' },
      { status: null }
    ]
    const completed = tasks.filter(t => isGoalDayCompleted(t.status as string)).length
    expect(completed).toBe(2)
  })
})

describe('toGoalDayStatus', () => {
  it('maps boolean to DB varchar convention', () => {
    expect(toGoalDayStatus(true)).toBe('completed')
    expect(toGoalDayStatus(false)).toBe('active')
  })
})

