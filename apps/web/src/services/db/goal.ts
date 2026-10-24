// goal table operations (top level of goal → goal_months → goal_days)
import { createBase } from '@/services/supabase'
import { TABLES } from './tables'
import type { EntityId, GoalStatus } from './types'

// Goal 数据接口
export interface Goal {
  id: EntityId
  user_id?: string
  title: string
  description?: string | null
  status?: GoalStatus
  year?: number | null
  priority?: number
  category_id?: EntityId | null
  task_time?: string | null
  duration?: number | null
  carry_over_lookback_days?: number
  created_at?: string
  updated_at?: string
  goal_categories?: {
    id: EntityId
    name: string
  }
}

// Goal 创建参数
export interface CreateGoalPayload {
  user_id?: string
  title: string
  description?: string | null
  status?: GoalStatus
  year?: number | null
  priority?: number
  category_id?: EntityId | null
  task_time?: string | null
  duration?: number | null
  carry_over_lookback_days?: number
}

// Goal 更新参数
export interface UpdateGoalPayload {
  title?: string
  description?: string | null
  status?: GoalStatus
  year?: number | null
  priority?: number
  category_id?: EntityId | null
  task_time?: string | null
  duration?: number | null
  carry_over_lookback_days?: number
}

const base = createBase<Goal>(TABLES.GOAL)

export const goal = {
  async list(): Promise<Goal[]> {
    return await base.query(q => q
      .select('*, goal_categories(id, name)')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
    )
  },

  async create(payload: CreateGoalPayload): Promise<Goal> {
    return await base.create<Goal>(payload)
  },

  async update(id: EntityId, updates: UpdateGoalPayload): Promise<Goal> {
    return await base.update<Goal>(id, updates)
  },

  async delete(id: EntityId): Promise<void> {
    return await base.delete(id)
  }
}
