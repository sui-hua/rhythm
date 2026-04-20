/**
 * ============================================
 * 数据库服务主入口 (services/database.js)
 * ============================================
 *
 * @description
 * 整合所有数据表操作模块，提供统一的数据库访问接口。
 * 支持 RPC 调用用于批量操作等高性能场景。
 *
 * @module database
 *
 * @see {@link https://supabase.com/docs} Supabase 文档
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

/**
 * Supabase 客户端实例
 * @see module:@/config/supabase
 */
import client from '@/config/supabase'

/**
 * 各数据表操作模块
 */
import { plans } from './db/plans'
import { monthlyPlans } from './db/monthlyPlans'
import { dailyPlans } from './db/dailyPlans'
import { habits } from './db/habits'
import { tasks } from './db/tasks'
import { summaries } from './db/summaries'
import { plansCategory } from './db/plansCategory'
import { dailyReportViews } from './db/dailyReportViews'

/**
 * 数据库服务对象
 * @namespace db
 * @type {Object}
 *
 * @property {Object} plans - 总计划/年度计划表操作接口
 * @property {Object} plansCategory - 计划分类表操作接口
 * @property {Object} monthlyPlans - 月计划表操作接口
 * @property {Object} dailyPlans - 日计划表操作接口
 * @property {Object} habits - 习惯及打卡记录表操作接口
 * @property {Object} tasks - 每日具体任务表操作接口
 * @property {Object} summaries - 各种类型总结记录表操作接口
 * @property {Object} dailyReportViews - 日报弹窗查看记录表操作接口
 * @property {Function} rpc - 远程过程调用方法
 */
export const db = {
  /**
   * RPC 调用（用于批量操作等高性能场景）
   *
   * @description
   * 直接调用 Supabase 的 RPC 函数，适用于需要高性能批量操作的场景。
   * 注意：必须保持 throw contract，让调用方能感知失败。
   *
   * @param {string} name - RPC 函数名称
   * @param {Object} params - RPC 函数参数
   * @returns {Promise<any>} 返回 RPC 调用结果的 Promise
   *
   * @example
   * const result = await db.rpc('batch_upsert_daily_plans', { user_id: 'xxx', data: [...] })
   *
   * @see {@link https://supabase.com/docs/guides/database/functions} Supabase RPC 文档
   */
  rpc(name, params) {
    const result = client.rpc(name, params)
    // 确保返回的是 Promise，便于调用方用 async/await 或 .catch() 处理
    return result
  },

  /**
   * 总计划/年度计划表操作接口
   * @type {Object}
   */
  plans,

  /**
   * 计划分类表操作接口
   * @type {Object}
   */
  plansCategory,

  /**
   * 月计划表操作接口
   * @type {Object}
   */
  monthlyPlans,

  /**
   * 日计划表操作接口
   * @type {Object}
   */
  dailyPlans,

  /**
   * 习惯及打卡记录表操作接口
   * @type {Object}
   */
  habits,

  /**
   * 每日具体任务表操作接口
   * @type {Object}
   */
  tasks,

  /**
   * 各种类型总结记录表操作接口
   * @type {Object}
   */
  summaries,

  /**
   * 日报弹窗查看记录表操作接口
   * @type {Object}
   */
  dailyReportViews
}
