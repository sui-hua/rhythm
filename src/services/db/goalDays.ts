// goal_days table operations (third level of goal → goal_months → goal_days)
import supabase, { createBase } from '@/services/supabase'
import { TABLES } from './tables'
import { toDateOnly } from '@/utils/dateFormatter'

// GoalDay 数据接口
export interface GoalDay {
  id: string
  goal_month_id?: string
  user_id: string
  title: string
  description?: string | null
  status: string // 'active' | 'completed' | 'archived'
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
  status?: string
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
  status?: string
  priority?: number
  day?: string
  task_time?: string | null
  duration?: number
}

const base = createBase<GoalDay>(TABLES.GOAL_DAYS)
const goalsBase = createBase(TABLES.GOAL)

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

  /**
   * 查询指定月份日期范围内的所有目标计划
   * @param start - 月首日期
   * @param end - 月末日期
   * @returns 该月所有 GoalDay 列表
   */
  async listByMonth(start: Date, end: Date): Promise<GoalDay[]> {
    const startStr = toDateOnly(start)
    const endStr = toDateOnly(end)

    return await base.query(q => q
      .select('*')
      .gte('day', startStr)
      .lte('day', endStr)
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

    // 查询日期范围内的 goal_days（不含嵌套关联，避免 PostgREST 关系解析失败）
    const rows = await base.query(q => q
      .select('*')
      .gte('day', earliestDateStr)
      .lte('day', targetDateStr)
      .order('day', { ascending: true })
    )

    if (!rows || rows.length === 0) return []

    // 单独查询 goal_months + goal 的 carry_over_lookback_days 和时间信息
    const goalMonthIds = [...new Set(rows.map(r => r.goal_month_id).filter(Boolean))]
    const goalMonthMap = new Map<string, { task_time?: string | null; duration?: number; carry_over_lookback_days: number }>()

    if (goalMonthIds.length > 0) {
      const { data: monthRows } = await supabase
        .from(TABLES.GOAL_MONTHS)
        .select(`
          id,
          task_time,
          duration,
          goal:goal_id (task_time, duration, carry_over_lookback_days)
        `)
        .in('id', goalMonthIds)

      for (const gm of (monthRows || [])) {
        const goal = Array.isArray(gm.goal) ? gm.goal[0] : gm.goal
        goalMonthMap.set(gm.id, {
          task_time: gm.task_time,
          duration: gm.duration,
          carry_over_lookback_days: Number(goal?.carry_over_lookback_days || 0)
        })
      }
    }

    // 关联数据并过滤 carry-over 项
    return rows.filter((item) => {
      if (item.day === targetDateStr) {
        // 当天项：附加继承的时间信息后直接保留
        const gm = item.goal_month_id ? goalMonthMap.get(item.goal_month_id) : undefined
        item.goal_months = gm ? { id: item.goal_month_id!, task_time: gm.task_time, duration: gm.duration } : undefined
        return true
      }
      if (item.status !== 'active') return false

      // 通过单独查询的 map 获取 carry_over_lookback_days
      const lookbackDays = item.goal_month_id
        ? (goalMonthMap.get(item.goal_month_id)?.carry_over_lookback_days || 0)
        : 0
      if (lookbackDays <= 0) return false

      const earliestAllowed = subtractDays(date, lookbackDays)
      const itemDate = new Date(`${item.day}T00:00:00`)
      const withinWindow = itemDate >= earliestAllowed && item.day < targetDateStr

      // 通过 carry-over 的项也需要附加继承的时间信息
      if (withinWindow) {
        const gm = goalMonthMap.get(item.goal_month_id!)
        item.goal_months = gm ? { id: item.goal_month_id!, task_time: gm.task_time, duration: gm.duration } : undefined
      }

      return withinWindow
    })
  }
}
