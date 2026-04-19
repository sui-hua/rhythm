import { describe, expect, it } from 'vitest'
import { getInitialScrollTarget } from '@/views/day/composables/getInitialScrollTarget'

describe('getInitialScrollTarget', () => {
  const today = new Date(2026, 3, 19)
  const now = new Date(2026, 3, 19, 15, 30)

  it('无任务时回到默认 08:00', () => {
    expect(getInitialScrollTarget({
      schedule: [],
      targetDate: today,
      now
    })).toEqual({
      type: 'default-hour',
      hour: 8
    })
  })

  it('今天且目标任务结束不足两小时，滚到任务', () => {
    const schedule = [
      { startHour: 14, durationHours: 0.5, completed: false },
      { startHour: 16, durationHours: 1, completed: false }
    ]

    expect(getInitialScrollTarget({
      schedule,
      targetDate: today,
      now
    })).toEqual({
      type: 'task',
      index: 0
    })
  })

  it('今天且目标未完成任务已过去两小时以上，滚到当前时间', () => {
    const schedule = [
      { startHour: 9, durationHours: 1, completed: false },
      { startHour: 16, durationHours: 1, completed: false }
    ]

    expect(getInitialScrollTarget({
      schedule,
      targetDate: today,
      now
    })).toEqual({
      type: 'current-time',
      hour: 15
    })
  })

  it('今天且全部已完成但首个任务已过去两小时以上，滚到当前时间', () => {
    const schedule = [
      { startHour: 10, durationHours: 1, completed: true },
      { startHour: 13, durationHours: 1, completed: true }
    ]

    expect(getInitialScrollTarget({
      schedule,
      targetDate: today,
      now
    })).toEqual({
      type: 'current-time',
      hour: 15
    })
  })

  it('今天且全部已完成但首个任务未过去两小时，仍滚到首个任务', () => {
    const schedule = [
      { startHour: 14, durationHours: 0.75, completed: true },
      { startHour: 16, durationHours: 1, completed: true }
    ]

    expect(getInitialScrollTarget({
      schedule,
      targetDate: today,
      now
    })).toEqual({
      type: 'task',
      index: 0
    })
  })

  it('非今天时即使任务已过去很久，仍滚到目标任务', () => {
    const schedule = [
      { startHour: 9, durationHours: 1, completed: false }
    ]

    expect(getInitialScrollTarget({
      schedule,
      targetDate: new Date(2026, 3, 18),
      now
    })).toEqual({
      type: 'task',
      index: 0
    })
  })
})
