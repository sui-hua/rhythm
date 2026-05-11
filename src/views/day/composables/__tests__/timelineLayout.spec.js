import { describe, expect, it } from 'vitest'
import { buildTimelineDisplaySchedule } from '@/views/day/composables/timelineLayout'

describe('buildTimelineDisplaySchedule', () => {
  it('stacks carry-over items that share the same time slot', () => {
    const items = buildTimelineDisplaySchedule([
      {
        id: 'carry-1',
        title: '补做 1',
        startHour: 22,
        durationHours: 0.5,
        isCarryOver: true
      },
      {
        id: 'carry-2',
        title: '补做 2',
        startHour: 22,
        durationHours: 0.5,
        isCarryOver: true
      },
      {
        id: 'carry-3',
        title: '补做 3',
        startHour: 22,
        durationHours: 0.5,
        isCarryOver: true
      }
    ])

    expect(items).toHaveLength(3)
    expect(items.every(item => item._isStackedCarryOver)).toBe(true)
    expect(items.map(item => item._stackIndex)).toEqual([0, 1, 2])
    expect(items.map(item => item._stackSize)).toEqual([3, 3, 3])
    expect(items.map(item => item._numCols)).toEqual([1, 1, 1])
  })

  it('keeps regular overlapping tasks in side-by-side columns', () => {
    const items = buildTimelineDisplaySchedule([
      {
        id: 'task-1',
        title: '任务 1',
        startHour: 10,
        durationHours: 1
      },
      {
        id: 'task-2',
        title: '任务 2',
        startHour: 10.2,
        durationHours: 0.8
      }
    ])

    expect(items.map(item => item._isStackedCarryOver || false)).toEqual([false, false])
    expect(items.map(item => item._numCols)).toEqual([2, 2])
    expect(items.map(item => item._col)).toEqual([0, 1])
  })
})
