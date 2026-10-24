import { describe, expect, expectTypeOf, it } from 'vitest'
import { toGoalDayStatus } from '@/utils/goalDayStatus'
import type { CreateGoalPayload, Goal } from '@/services/db/goal'
import type { CreateGoalDayPayload, GoalDay } from '@/services/db/goalDays'
import type { SummaryPayload } from '@/services/db/summary'
import type { GoalStatus, JsonObject } from '@/services/db/types'

describe('database shared model types', () => {
  it('goal payload includes Direction writable fields', () => {
    const payload: CreateGoalPayload = {
      user_id: 'user-1',
      title: '年度目标',
      status: 'active',
      year: 2026,
      category_id: null,
      task_time: '09:00',
      duration: 45,
      carry_over_lookback_days: 3
    }

    const goal: Goal = {
      id: 'goal-1',
      user_id: 'user-1',
      title: payload.title,
      status: payload.status,
      year: payload.year,
      category_id: payload.category_id,
      task_time: payload.task_time,
      duration: payload.duration,
      carry_over_lookback_days: payload.carry_over_lookback_days
    }

    expect(goal.status).toBe('active')
  })

  it('goal day status is narrowed to shared GoalStatus', () => {
    const status = toGoalDayStatus(true)
    expectTypeOf(status).toEqualTypeOf<GoalStatus>()

    const day: GoalDay = {
      id: 'day-1',
      user_id: 'user-1',
      goal_month_id: 'month-1',
      title: '目标日计划',
      status,
      day: '2026-06-12'
    }
    const payload: CreateGoalDayPayload = {
      user_id: day.user_id,
      goal_month_id: day.goal_month_id,
      title: day.title,
      status: 'archived',
      day: day.day
    }

    expect(payload.status).toBe('archived')
  })

  it('summary content uses JSON object rather than loosely typed records', () => {
    const content: JsonObject = {
      done: '完成任务',
      nested: {
        score: 5,
        tags: ['focus', 'review']
      }
    }
    const payload: SummaryPayload = {
      user_id: 'user-1',
      kind: 'daily',
      period_start: '2026-06-12',
      content
    }

    expect(payload.content?.done).toBe('完成任务')
  })
})
