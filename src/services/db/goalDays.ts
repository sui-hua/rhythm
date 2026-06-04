// goal_days table operations (third level of goal → goal_months → goal_days)
import client from '@/services/supabase'
import { TABLES } from './tables'
import { toDateOnly } from '@/utils/dateFormatter'

// GoalDay 数据接口
export interface GoalDay {
  id: string
  goal_month_id?: string
  user_id: string
  title: string
  description?: string | null
  status: number // 0 = pending, 1 = completed
  priority?: number
  created_at?: string
  updated_at?: string
  day: string
  task_time?: string | null
  duration?: number
  // 关联查询时可能包含的字段
  goal_months?: {
    id: string
    task_time?: string | null
    duration?: number
    goal?: {
      id: string
      task_time?: string | null
      duration?: number
      carry_over_lookback_days?: number
    }
  }
}

// GoalDay 创建参数
export interface CreateGoalDayPayload {
  goal_month_id?: string
  user_id: string
  title: string
  description?: string | null
  status?: number
  priority?: number
  day: string
  task_time?: string | null
  duration?: number
}

// GoalDay 更新参数
export interface UpdateGoalDayPayload {
  goal_month_id?: string
  title?: string
  description?: string | null
  status?: number
  priority?: number
  day?: string
  task_time?: string | null
  duration?: number
}

const base = client.createBase<GoalDay>(TABLES.GOAL_DAYS)
const goalsBase = client.createBase(TABLES.GOAL)

// 计算日期减去指定天数后的日期
const subtractDays = (date: Date, days: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() - days)
  return next
}

// 获取最大的结转回溯天数
async function getMaxCarryOverLookbackDays(): Promise<number> {
  const rows = await goalsBase.query(q => q
    .select('carry_over_lookback_days')
    .gt('carry_over_lookback_days', 0)
    .order('carry_over_lookback_days', { ascending: false })
    .limit(1)
  )

  return Number(rows?.[0]?.carry_over_lookback_days || 0)
}

export const goalDays = {
  async list(monthPlanId?: string | null): Promise<GoalDay[]> {
    return await base.query(q => {
      let query = q.select('*').order('day', { ascending: true })
      if (monthPlanId) query = query.eq('goal_month_id', monthPlanId)
      return query
    })
  },

  async create(payload: CreateGoalDayPayload): Promise<GoalDay> {
    return await base.create<GoalDay>(payload)
  },

  async update(id: string, updates: UpdateGoalDayPayload): Promise<GoalDay> {
    return await base.update<GoalDay>(id, updates)
  },

  async delete(id: string): Promise<void> {
    return await base.delete(id)
  },

  async deleteByIds(ids: string[]): Promise<GoalDay[]> {
    if (!Array.isArray(ids) || ids.length === 0) return []

    return await base.query(q => q
      .delete()
      .in('id', ids)
    )
  },

  async listByDate(date: Date): Promise<GoalDay[]> {
    const dateStr = toDateOnly(date)

    return await base.query(q => q
      .select(`
        *,
        goal_months (
          id,
          task_time,
          duration,
          goal (
            id,
            task_time,
            duration
          )
        )
      `)
      .eq('day', dateStr)
    )
  },

  async listForDayView(date: Date): Promise<GoalDay[]> {
    const targetDateStr = toDateOnly(date)
    const maxLookbackDays = await getMaxCarryOverLookbackDays()

    if (maxLookbackDays === 0) {
      return await this.listByDate(date)
    }

    const earliestDateStr = toDateOnly(subtractDays(date, maxLookbackDays))
    const rows = await base.query(q => q
      .select(`
        *,
        goal_months (
          id,
          task_time,
          duration,
          goal (
            id,
            task_time,
            duration,
            carry_over_lookback_days
          )
        )
      `)
      .gte('day', earliestDateStr)
      .lte('day', targetDateStr)
      .order('day', { ascending: true })
    )

    return (rows || []).filter((item) => {
      if (item.day === targetDateStr) return true
      if (item.status !== 0) return false

      const lookbackDays = Number(item.goal_months?.goal?.carry_over_lookback_days || 0)
      if (lookbackDays <= 0) return false

      const earliestAllowed = subtractDays(date, lookbackDays)
      const itemDate = new Date(`${item.day}T00:00:00`)
      return itemDate >= earliestAllowed && item.day < targetDateStr
    })
  }
}
