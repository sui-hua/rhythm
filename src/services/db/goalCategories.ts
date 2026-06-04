/**
 * goalCategories.ts
 * 目标分类（Category）的 CRUD 操作模块
 * 提供 goal_categories 表的查询、创建、更新、删除接口
 */

import client from '@/services/supabase'
import { TABLES } from './tables'

// GoalCategory 数据接口
export interface GoalCategory {
  id: string
  user_id: string
  name: string
  created_at?: string
  updated_at?: string
  sort_order?: number
}

// GoalCategory 创建参数
export interface CreateGoalCategoryPayload {
  user_id: string
  name: string
  sort_order?: number
}

// GoalCategory 更新参数
export interface UpdateGoalCategoryPayload {
  name?: string
  sort_order?: number
}

const supabase = client.createBase<GoalCategory>(TABLES.GOAL_CATEGORIES)

export const goalCategories = {
  async list(): Promise<GoalCategory[]> {
    return await supabase.query(q => q
      .select('*')
      .order('name', { ascending: true })
    )
  },

  async create(category: CreateGoalCategoryPayload): Promise<GoalCategory> {
    return await supabase.create<GoalCategory>(category)
  },

  async update(id: string, updates: UpdateGoalCategoryPayload): Promise<GoalCategory> {
    return await supabase.update<GoalCategory>(id, updates)
  },

  async delete(id: string): Promise<void> {
    return await supabase.delete(id)
  }
}
