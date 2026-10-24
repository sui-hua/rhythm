/**
 * ============================================
 * 任务数据表操作 (services/db/task.ts)
 * ============================================
 *
 * 【模块职责】
 * - 封装 tasks 表的 CRUD 操作
 * - 每日具体任务管理
 */

import { createBase } from '@/services/supabase'
import { TABLES } from './tables'
import type { EntityId, TaskStatus } from './types'

// Task 数据接口
export interface Task {
  id: EntityId
  user_id?: string
  title: string
  description?: string | null
  status?: TaskStatus
  completed?: boolean
  start_time?: string | null
  end_time?: string | null
  actual_start_time?: string | null
  actual_end_time?: string | null
  created_at?: string
  updated_at?: string
}

// Task 创建参数
export interface CreateTaskPayload {
  title: string
  user_id?: string
  description?: string | null
  status?: TaskStatus
  completed?: boolean
  start_time?: string | null
  end_time?: string | null
}

// Task 更新参数
export interface UpdateTaskPayload {
  title?: string
  description?: string | null
  status?: TaskStatus
  completed?: boolean
  start_time?: string | null
  end_time?: string | null
  actual_start_time?: string | null
  actual_end_time?: string | null
}

const supabase = createBase<Task>(TABLES.TASK)

export const task = {
  /**
   * 按时间范围查询任务列表
   * @param start - 开始时间，会转换为 ISO 字符串用于查询下限
   * @param end - 结束时间，会转换为 ISO 字符串用于查询上限
   * @returns 查询结果，按 start_time 升序排列
   */
  async list(start?: Date, end?: Date): Promise<Task[]> {
    return await supabase.query(q => {
      let query = q.select('*').order('start_time', { ascending: true })
      if (start) query = query.gte('start_time', start.toISOString())
      if (end) query = query.lte('start_time', end.toISOString())
      return query
    })
  },

  /**
   * 创建新任务
   * @param taskData - 任务数据对象
   * @returns 创建结果，包含插入的数据
   */
  async create(taskData: CreateTaskPayload): Promise<Task> {
    return await supabase.create<Task>(taskData)
  },

  /**
   * 更新指定任务
   * @param id - 任务 ID
   * @param updates - 要更新的字段
   * @returns 更新结果
   */
  async update(id: EntityId, updates: UpdateTaskPayload): Promise<Task> {
    return await supabase.update<Task>(id, updates)
  },

  /**
   * 删除指定任务
   * @param id - 任务 ID
   */
  async delete(id: EntityId): Promise<void> {
    return await supabase.delete(id)
  },

  /**
   * 根据 ID 查询单个任务
   * @param id - 任务 ID
   * @returns 单个任务对象
   */
  async getById(id: EntityId): Promise<Task> {
    return await supabase.getById(id)
  },

  /**
   * 查询收件箱（Inbox）中的任务
   * @returns 查询结果，包含所有 inbox 状态的任务
   */
  async listInbox(): Promise<Task[]> {
    return await supabase.query(q =>
      q.select('*').eq('status', 'inbox').order('created_at', { ascending: false })
    )
  }
}
