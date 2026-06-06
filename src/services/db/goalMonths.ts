// goal_months table operations (second level of goal → goal_months → goal_days)
import { createBase } from '@/services/supabase'
import { TABLES } from './tables'

// GoalMonth 数据接口
export interface GoalMonth {
  id: string
  goal_id: string
  user_id: string
  title: string
  description?: string | null
  status?: 'active' | 'completed' | 'archived'
  priority?: number
  created_at?: string
  updated_at?: string
  month: string
  task_time?: string | null
  duration?: number | null
}

// GoalMonth 创建参数
export interface CreateGoalMonthPayload {
  goal_id?: string
  user_id: string
  title: string
  description?: string | null
  status?: 'active' | 'completed' | 'archived'
  priority?: number
  month?: string
  task_time?: string | null
  duration?: number | null
}

// GoalMonth 更新参数
export interface UpdateGoalMonthPayload {
  goal_id?: string
  title?: string
  description?: string | null
  status?: 'active' | 'completed' | 'archived'
  priority?: number
  month?: string
  task_time?: string | null
  duration?: number | null
}

const base = createBase<GoalMonth>(TABLES.GOAL_MONTHS)

export const goalMonths = {
  async list(goalId?: string | null): Promise<GoalMonth[]> {
    return await base.query(q => {
      let query = q.select('*').order('month', { ascending: true })
      if (goalId) query = query.eq('goal_id', goalId)
      return query
    })
  },

  async create(payload: CreateGoalMonthPayload): Promise<GoalMonth> {
    return await base.create<GoalMonth>(payload)
  },

  async update(id: string, updates: UpdateGoalMonthPayload): Promise<GoalMonth> {
    return await base.update<GoalMonth>(id, updates)
  },

  async delete(id: string): Promise<void> {
    return await base.delete(id)
  }
}
