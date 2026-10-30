import type { DailyPlanRecord, DailyPlanStatus } from '@/domain/day/types'
import { toDateKey } from '@/domain/day/time'
import { apiRequest } from './client'

/**
 * 日计划数据访问（领域名 DailyPlan ↔ 数据库表 goal_days）
 *
 * 后端 `/goal-days/by-date` 已经按 web 端的嵌套结构返回：
 *   goal_days → goal_months → goal
 * 这里只做字段重命名，不再拼接查询。
 */

type GoalDayRow = {
  id: string
  title: string
  description: string | null
  day: string
  task_time: string | null
  duration: number | null
  status: string | null
  goal_months: {
    id: string
    task_time: string | null
    duration: number | null
    goal: {
      id: string
      task_time: string | null
      duration: number | null
      carry_over_lookback_days?: number
    } | null
  } | null
}

function mapStatus(value: string | null): DailyPlanStatus {
  if (value === 'active' || value === 'completed' || value === 'archived') return value
  return null
}

function mapRow(row: GoalDayRow): DailyPlanRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    day: row.day,
    taskTime: row.task_time,
    duration: row.duration,
    status: mapStatus(row.status),
    monthlyPlan: row.goal_months
      ? {
          id: row.goal_months.id,
          taskTime: row.goal_months.task_time,
          duration: row.goal_months.duration,
          plan: row.goal_months.goal
            ? {
                id: row.goal_months.goal.id,
                taskTime: row.goal_months.goal.task_time,
                duration: row.goal_months.goal.duration
              }
            : null
        }
      : null
  }
}

export async function listDailyPlansForDate(date: Date): Promise<DailyPlanRecord[]> {
  const rows = await apiRequest<GoalDayRow[]>('/goal-days/by-date', {
    query: { date: toDateKey(date) }
  })

  return rows.map(mapRow)
}

/** status 是 varchar 枚举，写入 'completed' / 'active'，与库中真实取值一致 */
export async function toggleDailyPlanComplete(dailyPlanId: string, completed: boolean) {
  const row = await apiRequest<GoalDayRow>(`/goal-days/${dailyPlanId}`, {
    method: 'PATCH',
    body: { status: completed ? 'completed' : 'active' }
  })

  return mapRow(row)
}
