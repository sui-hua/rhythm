import { describe, expect, it } from 'vitest'
import { buildDayExecutionItems } from '@/views/day/composables/useDayExecutionItems'

describe('buildDayExecutionItems', () => {
  it('marks historical pending daily plans as carry-over items', () => {
    const items = buildDayExecutionItems({
      targetDate: new Date('2026-04-28T00:00:00'),
      goalDays: [
        {
          id: 'plan-old',
          title: '补做复盘',
          day: '2026-04-27',
          task_time: '08:00',
          duration: 30,
          status: 0
        }
      ]
    })

    expect(items[0]).toMatchObject({
      id: 'plan-old',
      type: 'goal_day',
      isCarryOver: true,
      carryOverSourceDate: '2026-04-27',
      carryOverLabel: '原计划 4月27日'
    })
  })
})
