/**
 * ============================================
 * 日计划状态工具 (utils/dailyPlanStatus.js)
 * ============================================
 *
 * 【模块职责】
 * - 处理 daily_plans 表中 status 字段的转换
 * - status: smallint → 0 = 待完成, 1 = 已完成
 *
 * 【函数说明】
 * - isDailyPlanCompleted()  → 根据 status 判断是否完成
 * - toDailyPlanStatus()    → 将布尔值转换为 status
 */

// daily_plans.status uses smallint: 0 = pending, 1 = completed.

export function isDailyPlanCompleted(status) {
  return status === 1
}

export function toDailyPlanStatus(completed) {
  return completed ? 1 : 0
}
