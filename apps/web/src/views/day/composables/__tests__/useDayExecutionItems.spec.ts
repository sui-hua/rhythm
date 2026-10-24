import { describe, expect, it } from 'vitest'
import { buildDayExecutionItems } from '@/utils/dayExecutionItems'
import type { DayExecutionItemsInput } from '@/utils/dayExecutionItems'

describe('buildDayExecutionItems', () => {
  it('marks historical pending daily plans as carry-over items', () => {
    const input: DayExecutionItemsInput = {
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
    }

    const items = buildDayExecutionItems(input)

    expect(items[0]).toMatchObject({
      id: 'plan-old',
      type: 'goal_day',
      scheduledDate: '2026-04-28',
      isCarryOver: true,
      carryOverSourceDate: '2026-04-27',
      carryOverLabel: '原计划 4月27日'
    })
  })

  it('attaches the selected date to habit schedule items', () => {
    const input: DayExecutionItemsInput = {
      targetDate: new Date('2026-06-12T00:00:00'),
      habits: [
        {
          id: 'habit-1',
          title: '晨间拉伸',
          task_time: '06:30',
          duration: 30
        }
      ],
      habitLogs: []
    }

    const items = buildDayExecutionItems(input)
    const habit = items.find(item => item.type === 'habit')

    expect(habit).toMatchObject({
      id: 'habit-1',
      type: 'habit',
      scheduledDate: '2026-06-12'
    })
  })
})
