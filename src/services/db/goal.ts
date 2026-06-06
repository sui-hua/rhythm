// goal table operations (top level of goal → goal_months → goal_days)
import { createBase } from '@/services/supabase'
import { TABLES } from './tables'

// Goal 数据接口
export interface Goal {
  id: string | number
  title: string
  description?: string
  priority?: number
  category_id?: string | number
  created_at?: string
  updated_at?: string
  goal_categories?: {
    id: string | number
    name: string
  }
}

// Goal 创建参数
export interface CreateGoalPayload {
  title: string
  description?: string
  priority?: number
  category_id?: string | number
}

// Goal 更新参数
export interface UpdateGoalPayload {
  title?: string
  description?: string
  priority?: number
  category_id?: string | number
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

  async update(id: string | number, updates: UpdateGoalPayload): Promise<Goal> {
    return await base.update<Goal>(id, updates)
  },

  async delete(id: string | number): Promise<void> {
    return await base.delete(id)
  }
}
