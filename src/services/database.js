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
 * - goal              → 总计划/年度计划
 * - goalCategories    → 计划分类
 * - goalMonths        → 月计划
 * - goalDays          → 日计划
 * - habit            → 习惯及打卡记录
 * - task             → 每日具体任务
 * - summary           → 各种类型总结记录
 * - dailyReportLog   → 日报弹窗查看记录
 */

/**
 * Supabase 客户端实例
 * @see module:@/config/supabase
 */
import client from '@/config/supabase'

/**
 * 各数据表操作模块
 */
import { goal } from './db/goal'
import { goalMonths } from './db/goalMonths'
import { goalDays } from './db/goalDays'
import { habit } from './db/habit'
import { task } from './db/task'
import { summary } from './db/summary'
import { goalCategories } from './db/goalCategories'
import { dailyReportLog } from './db/dailyReportLog'

/**
 * 数据库服务对象
 * @namespace db
 * @type {Object}
 *
 * @property {Object} goal - 总计划/年度计划表操作接口
 * @property {Object} goalCategories - 计划分类表操作接口
 * @property {Object} goalMonths - 月计划表操作接口
 * @property {Object} goalDays - 日计划表操作接口
 * @property {Object} habit - 习惯及打卡记录表操作接口
 * @property {Object} task - 每日具体任务表操作接口
 * @property {Object} summary - 各种类型总结记录表操作接口
 * @property {Object} dailyReportLog - 日报弹窗查看记录表操作接口
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
  goal,

  /**
   * 计划分类表操作接口
   * @type {Object}
   */
  goalCategories,

  /**
   * 月计划表操作接口
   * @type {Object}
   */
  goalMonths,

  /**
   * 日计划表操作接口
   * @type {Object}
   */
  goalDays,

  /**
   * 习惯及打卡记录表操作接口
   * @type {Object}
   */
  habit,

  /**
   * 每日具体任务表操作接口
   * @type {Object}
   */
  task,

  /**
   * 各种类型总结记录表操作接口
   * @type {Object}
   */
  summary,

  /**
   * 日报弹窗查看记录表操作接口
   * @type {Object}
   */
  dailyReportLog
}
