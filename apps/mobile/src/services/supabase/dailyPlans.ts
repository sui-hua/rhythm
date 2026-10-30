import type { DailyPlanRecord } from '@/domain/day/types'
import { toDateKey } from '@/domain/day/time'
import { supabase } from './client'

/**
 * 日计划数据访问（领域名 DailyPlan ↔ 数据库表 goal_days）
 *
 * 【表名映射】数据库在 Phase 2 统一改为单数命名，此处必须使用新表名：
 *   daily_plans   → goal_days
 *   monthly_plans → goal_months
 *   plans         → goal
 *
 * 【status 语义】goal_days.status 是 varchar 枚举 'active' | 'completed' | 'archived'，
 * 不是数字 0/1，写入与判断都必须用字符串。
 */

// 三级计划链路共用的时间/时长字段，逐级继承（日 → 月 → 目标）
const PLAN_SELECT = `
  id,title,description,day,task_time,duration,status,
  goal_months (
    id,task_time,duration,
    goal ( id,task_time,duration )
  )
`

function mapRow(row: any): DailyPlanRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    day: row.day,
    taskTime: row.task_time,
    duration: row.duration,
    status: row.status,
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

export async function listDailyPlansForDate(date: Date) {
  const { data, error } = await supabase
    .from('goal_days')
    .select(PLAN_SELECT)
    .eq('day', toDateKey(date))

  if (error) throw error

  return (data ?? []).map(mapRow)
}

export async function toggleDailyPlanComplete(dailyPlanId: string, completed: boolean) {
  const { data, error } = await supabase
    .from('goal_days')
    .update({ status: completed ? 'completed' : 'active' })
    .eq('id', dailyPlanId)
    .select(PLAN_SELECT)
    .single()

  if (error) throw error

  return mapRow(data)
}
