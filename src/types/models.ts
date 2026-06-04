// 共享数据模型类型定义
// 数据库实体类型从 services/db/ 各模块 re-export，避免重复定义

export type { Task } from '@/services/db/task'
export type { Goal } from '@/services/db/goal'
export type { GoalMonth } from '@/services/db/goalMonths'
export type { GoalDay } from '@/services/db/goalDays'
export type { GoalCategory } from '@/services/db/goalCategories'

// 从 habit 服务导入类型（用于扩展）
import type { Habit as BaseHabit, HabitLog as BaseHabitLog } from '@/services/db/habit'
export type { BaseHabit as Habit, BaseHabitLog as HabitLog }

/** 带日志与统计数据的扩展习惯对象（由 habitStore + composable 补充字段） */
export interface AugmentedHabit extends BaseHabit {
  logs: BaseHabitLog[]
  monthlyLogs: BaseHabitLog[]
  completedDays: number[]
  total: number
  completionRate: number
  streak: number
}

/** 习惯重复规则 */
export interface HabitFrequency {
  type: 'daily' | 'weekly' | 'monthly'
  weekdays?: number[]
  monthDays?: number[]
}

/** 日程安排项（由 buildDayExecutionItems 生成） */
export interface DailyScheduleItem {
  id: string
  sourceLabel: 'task' | 'goal_day' | 'habit'
  type: 'task' | 'goal_day' | 'habit'
  original: unknown
  startHour?: number
  durationHours: number
  rawDuration: number
  time: string
  duration: string
  category: string
  title: string
  description: string
  completed: boolean
  actual_start_time?: string | null
  actual_end_time?: string | null
  isCarryOver?: boolean
  carryOverSourceDate?: string | null
  carryOverLabel?: string
  [key: string]: unknown
}

/** 番茄钟活跃任务 */
export interface ActiveTask {
  id: string
  title: string
  type: 'task'
  actual_start_time?: string | null
  actual_end_time?: string | null
  completed: boolean
  start_time?: string
  end_time?: string
  original?: {
    duration?: number
    [key: string]: unknown
  }
  [key: string]: unknown
}
