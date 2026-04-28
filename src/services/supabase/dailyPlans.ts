import type { DailyPlanRecord } from '@/domain/day/types'
import { toDateKey } from '@/domain/day/time'
import { supabase } from './client'

function mapRow(row: any): DailyPlanRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    day: row.day,
    taskTime: row.task_time,
    duration: row.duration,
    status: row.status,
    monthlyPlan: row.monthly_plans
      ? {
          id: row.monthly_plans.id,
          taskTime: row.monthly_plans.task_time,
          duration: row.monthly_plans.duration,
          plan: row.monthly_plans.plans
            ? {
                id: row.monthly_plans.plans.id,
                taskTime: row.monthly_plans.plans.task_time,
                duration: row.monthly_plans.plans.duration
              }
            : null
        }
      : null
  }
}

export async function listDailyPlansForDate(date: Date) {
  const { data, error } = await supabase
    .from('daily_plans')
    .select(
      `
      id,title,description,day,task_time,duration,status,
      monthly_plans (
        id,task_time,duration,
        plans ( id,task_time,duration )
      )
    `
    )
    .eq('day', toDateKey(date))

  if (error) throw error

  return (data ?? []).map(mapRow)
}

export async function toggleDailyPlanComplete(dailyPlanId: string, completed: boolean) {
  const { data, error } = await supabase
    .from('daily_plans')
    .update({ status: completed ? 1 : 0 })
    .eq('id', dailyPlanId)
    .select(
      `
      id,title,description,day,task_time,duration,status,
      monthly_plans (
        id,task_time,duration,
        plans ( id,task_time,duration )
      )
    `
    )
    .single()

  if (error) throw error

  return mapRow(data)
}