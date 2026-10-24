// goal_days.status 使用 varchar 存储：'active' | 'completed' | 'archived'
import type { GoalStatus } from '@/services/db/types'

// 判断目标日是否已完成
export function isGoalDayCompleted(status: unknown): boolean {
  return status === 'completed'
}

// 将布尔值转为数据库存储的状态值
export function toGoalDayStatus(completed: boolean): GoalStatus {
  return completed ? 'completed' : 'active'
}
