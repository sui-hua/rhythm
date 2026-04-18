import { describe, expect, it } from 'vitest'
import { getDirectionMonthlyProgress } from '@/views/direction/utils/progress'

const isDailyPlanCompleted = status => status === 'done'

describe('getDirectionMonthlyProgress', () => {
  it('matches month prefixes without zero padding so 1-9 months are counted correctly', () => {
    const dailyTasks = {
      'plan-p1-4-1': { status: 'done' },
      'plan-p1-4-2': { status: 'todo' },
      'plan-p1-04-3': { status: 'done' }
    }

    expect(
      getDirectionMonthlyProgress({
        dailyTasks,
        planId: 'p1',
        month: 4,
        isDailyPlanCompleted
      })
    ).toBe(50)
  })

  it('keeps 10-12 month prefixes working with the same raw numeric format', () => {
    const dailyTasks = {
      'plan-p1-10-1': { status: 'done' },
      'plan-p1-10-2': { status: 'todo' },
      'plan-p1-010-3': { status: 'done' }
    }

    expect(
      getDirectionMonthlyProgress({
        dailyTasks,
        planId: 'p1',
        month: 10,
        isDailyPlanCompleted
      })
    ).toBe(50)
  })
})
