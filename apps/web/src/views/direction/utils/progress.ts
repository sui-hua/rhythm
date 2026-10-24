/**
 * Direction 模块进度计算工具。
 * 根据日计划数据和完成状态回调，计算目标的月度完成进度百分比。
 */

import type { GoalDay } from '@/services/db/goalDays'

/** progress 工具函数参数 */
export interface MonthlyProgressParams {
  dailyTasks: Record<string, GoalDay>
  goalId: string | number | null | undefined
  month: number | null | undefined
  isGoalDayCompleted: (status: string) => boolean
}

/**
 * 生成月度计划 key 前缀。
 * 用于匹配 dailyTasks 中属于指定月份的条目。
 */
export const getDirectionMonthPrefix = (month: number): string => String(month)

/**
 * 计算指定目标在指定月份的完成进度百分比（0-100）。
 * 遍历 dailyTasks 中所有以 goal-{goalId}-{month}- 开头的条目，
 * 统计已完成数量与总数的比值并四舍五入。
 */
export const getDirectionMonthlyProgress = ({
  dailyTasks,
  goalId,
  month,
  isGoalDayCompleted
}: MonthlyProgressParams): number => {
  if (!goalId || !month) return 0

  const monthPrefix = getDirectionMonthPrefix(month)
  let total = 0
  let completed = 0

  for (const [key, task] of Object.entries(dailyTasks)) {
    if (key.startsWith(`goal-${goalId}-${monthPrefix}-`)) {
      total++
      if (isGoalDayCompleted(task.status)) completed++
    }
  }

  return total === 0 ? 0 : Math.round((completed / total) * 100)
}
