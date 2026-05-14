/**
 * ============================================
 * goal_days 状态工具 (utils/goalDayStatus.js)
 * ============================================
 *
 * 【模块职责】
 * - 处理 goal_days 表中 status 字段的转换
 * - status: smallint → 0 = 待完成, 1 = 已完成
 *
 * 【函数说明】
 * - isGoalDayCompleted()  → 根据 status 判断是否完成
 * - toGoalDayStatus()    → 将布尔值转换为 status
 */

// goal_days.status uses smallint: 0 = pending, 1 = completed.

export function isGoalDayCompleted(status) {
  return status === 1
}

export function toGoalDayStatus(completed) {
  return completed ? 1 : 0
}
