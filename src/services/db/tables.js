/**
 * ============================================
 * 数据库表名常量映射 (services/db/tables.js)
 * ============================================
 *
 * 集中管理所有业务表名，避免表名散落在各服务模块中。
 * Phase 2 数据库改名后只需更新此文件中的常量值。
 */
export const TABLES = {
  // Goals / Direction
  GOAL_CATEGORIES: 'goal_categories',
  GOAL: 'goal',
  GOAL_MONTHS: 'goal_months',
  GOAL_DAYS: 'goal_days',

  // Tasks
  TASK: 'task',

  // Habits
  HABIT: 'habit',
  HABIT_LOGS: 'habit_logs',

  // Summary
  SUMMARY: 'summary',

  // Day
  DAILY_REPORT_LOG: 'daily_report_log'
}
