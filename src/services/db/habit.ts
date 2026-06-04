import client from '@/services/supabase'
import { TABLES } from './tables'

// Habit 数据接口
export interface Habit {
  id: string | number
  name: string
  title?: string
  description?: string
  frequency?: string
  is_archived?: boolean
  task_time?: string | null
  duration?: number
  target_value?: string
  created_at?: string
  updated_at?: string
}

// Habit 打卡记录接口
export interface HabitLog {
  id: string | number
  habit_id: string | number
  log?: string
  completed_at?: string
}

// Habit 创建参数
export interface CreateHabitPayload {
  name: string
  description?: string
  frequency?: string
}

// Habit 更新参数
export interface UpdateHabitPayload {
  name?: string
  description?: string
  frequency?: string
  is_archived?: boolean
  title?: string
  task_time?: string | null
  duration?: number
}

const habitsBase = client.createBase<Habit>(TABLES.HABIT)
const habitLogsBase = client.createBase<HabitLog>(TABLES.HABIT_LOGS)

export const habit = {
  async list(): Promise<Habit[]> {
    return await habitsBase.query(q => q
      .select('*')
      .order('created_at', { ascending: true })
    )
  },

  async listLogsByDate(startDate: Date, endDate: Date): Promise<HabitLog[]> {
    return await habitLogsBase.query(q => q
      .select('*')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString())
    )
  },

  /**
   * 查询指定习惯的所有打卡记录
   * @param habitId - 习惯 ID
   * @returns 打卡记录列表，按完成时间升序排列
   */
  async listLogsByHabit(habitId: string | number): Promise<HabitLog[]> {
    return await habitLogsBase.query(q => q
      .select('*')
      .eq('habit_id', habitId)
      .order('completed_at', { ascending: true })
    )
  },

  /**
   * 查询指定年份的所有打卡记录
   * @param year - 年份（如 2026）
   * @returns 打卡记录列表，按完成时间升序排列
   */
  async listLogsByYear(year: number): Promise<HabitLog[]> {
    const startDate = new Date(year, 0, 1).toISOString()
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString()
    return await habitLogsBase.query(q => q
      .select('*')
      .gte('completed_at', startDate)
      .lte('completed_at', endDate)
      .order('completed_at', { ascending: true })
    )
  },

  /**
   * 创建新习惯
   * @param habitData - 习惯数据对象
   * @returns 创建成功的习惯记录
   */
  async create(habitData: CreateHabitPayload): Promise<Habit> {
    return await habitsBase.create<Habit>(habitData)
  },

  /**
   * 更新习惯信息
   * @param id - 习惯 ID
   * @param updates - 要更新的字段
   * @returns 更新后的习惯记录
   */
  async update(id: string | number, updates: UpdateHabitPayload): Promise<Habit> {
    return await habitsBase.update<Habit>(id, updates)
  },

  /**
   * 删除习惯
   * @param id - 习惯 ID
   */
  async delete(id: string | number): Promise<void> {
    return await habitsBase.delete(id)
  },

  /**
   * 习惯打卡
   * @param habitId - 习惯 ID
   * @param log - 打卡日志/备注
   * @param completedAt - 打卡时间（为 null 时使用当前时间）
   * @returns 创建的打卡记录
   */
  async log(
    habitId: string | number,
    log: string = '',
    completedAt: Date | null = null
  ): Promise<HabitLog> {
    const payload: Partial<HabitLog> = {
      habit_id: habitId,
      log
    }
    if (completedAt) {
      payload.completed_at = completedAt.toISOString()
    }
    return await habitLogsBase.create<HabitLog>(payload)
  },

  /**
   * 删除打卡记录（取消打卡）
   * @param logId - 打卡记录 ID
   */
  async deleteLog(logId: string | number): Promise<void> {
    return await habitLogsBase.delete(logId)
  }
}
