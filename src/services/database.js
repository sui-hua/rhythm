/**
 * ============================================
 * 数据库服务主入口 (services/database.js)
 * ============================================
 *
 * 【模块职责】
 * - 整合所有数据表操作模块
 * - 提供统一的数据库访问接口
 * - 支持 RPC 调用
 *
 * 【数据表模块】
 * - plans              → 总计划/年度计划
 * - plansCategory      → 计划分类
 * - monthlyPlans       → 月计划
 * - dailyPlans         → 日计划
 * - habits            → 习惯及打卡记录
 * - tasks             → 每日具体任务
 * - summaries          → 各种类型总结记录
 * - dailyReportViews   → 日报弹窗查看记录
 */
import client from '@/config/supabase'
import { plans } from './db/plans'
import { monthlyPlans } from './db/monthlyPlans'
import { dailyPlans } from './db/dailyPlans'
import { habits } from './db/habits'
import { tasks } from './db/tasks'
import { summaries } from './db/summaries'
import { plansCategory } from './db/plansCategory'
import { dailyReportViews } from './db/dailyReportViews'

export const db = {
  // RPC 调用（用于批量操作等高性能场景）
  // 注意：必须保持 throw contract，让调用方能感知失败
  rpc(name, params) {
    const result = client.rpc(name, params)
    // 确保返回的是 Promise，便于调用方用 async/await 或 .catch() 处理
    return result
  },
  // Plans (总计划/年度计划表操作)
  plans,
  // Plan Categories
  plansCategory,
  // Monthly Plans (月计划表操作)
  monthlyPlans,
  // Daily Plans (日计划表操作)
  dailyPlans,
  // Habits (习惯及打卡记录表操作)
  habits,
  // Tasks (每日具体任务表操作)
  tasks,
  // Summaries (各种类型总结记录表操作)
  summaries,
  // Daily report view logs (日报弹窗查看记录)
  dailyReportViews
}
