import { describe, expect, it } from 'vitest'
import { getDirectionMonthlyProgress } from '@/views/direction/utils/progress'
import type { GoalDay } from '@/services/db/goalDays'

// 完成状态判断回调，类型与 MonthlyProgressParams.isGoalDayCompleted 一致
const isGoalDayCompleted = (status: string): boolean => status === 'done'

describe('getDirectionMonthlyProgress', () => {
  it('matches month prefixes without zero padding so 1-9 months are counted correctly', () => {
    // 使用 Record<string, GoalDay> 类型，匹配函数参数签名
    const dailyTasks: Record<string, GoalDay> = {
      'goal-p1-4-1': { status: 'done' } as GoalDay,
      'goal-p1-4-2': { status: 'todo' } as GoalDay,
      'goal-p1-04-3': { status: 'done' } as GoalDay
    }

    expect(
      getDirectionMonthlyProgress({
        dailyTasks,
        goalId: 'p1',
        month: 4,
        isGoalDayCompleted
      })
    ).toBe(50)
  })

  it('keeps 10-12 month prefixes working with the same raw numeric format', () => {
    const dailyTasks: Record<string, GoalDay> = {
      'goal-p1-10-1': { status: 'done' } as GoalDay,
      'goal-p1-10-2': { status: 'todo' } as GoalDay,
      'goal-p1-010-3': { status: 'done' } as GoalDay
    }

    expect(
      getDirectionMonthlyProgress({
        dailyTasks,
        goalId: 'p1',
        month: 10,
        isGoalDayCompleted
      })
    ).toBe(50)
  })
})
