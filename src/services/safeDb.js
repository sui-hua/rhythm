/**
 * ============================================
 * 安全数据库封装 (services/safeDb.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 database.js 提供错误处理
 * - 操作失败时自动 toast 提示
 * - Direction 模块统一使用 safeDb
 *
 * 【与 database.js 的区别】
 * - database.js: 底层直连，RPC 调用
 * - safeDb.js: 封装版，失败时自动 toast 错误提示
 */
import { db } from './database'
import { useToast } from '@/composables/useToast'

// 错误消息配置（按表名和操作类型分类）
const ERROR_MESSAGES = {
  plans: {
    list: '获取目标列表失败',
    create: '创建目标失败',
    update: '更新目标失败',
    delete: '删除目标失败',
  },
  tasks: {
    list: '获取任务列表失败',
    create: '创建任务失败',
    update: '更新任务失败',
    delete: '删除任务失败',
  },
  habits: {
    list: '获取习惯列表失败',
    create: '创建习惯失败',
    update: '更新习惯失败',
    delete: '删除习惯失败',
  },
  habit_logs: {
    create: '打卡失败',
    delete: '取消打卡失败',
  },
  dailyPlans: {
    list: '获取日计划失败',
    create: '创建日计划失败',
    update: '更新日计划失败',
    delete: '删除日计划失败',
  },
  monthlyPlans: {
    list: '获取月计划失败',
    create: '创建月计划失败',
    update: '更新月计划失败',
    delete: '删除月计划失败',
  },
  plansCategory: {
    list: '获取分类失败',
    create: '创建分类失败',
    update: '更新分类失败',
    delete: '删除分类失败',
  },
  summaries: {
    list: '获取总结失败',
    create: '创建总结失败',
    update: '更新总结失败',
    delete: '删除总结失败',
  },
  dailyReportViews: {
    create: '记录日报查看失败',
  },
}

// 包装单个方法
function wrapMethod(tableName, method, operation) {
  return async (...args) => {
    try {
      const result = await db[tableName][method](...args)
      return result
    } catch (e) {
      console.error(`[safeDb] ${tableName}.${method} failed:`, e)
      const { toast } = useToast()
      const msg = ERROR_MESSAGES[tableName]?.[operation] || '操作失败'
      toast.error(msg)
      return null
    }
  }
}

// 包装整个表
function wrapTable(tableName) {
  const operations = ['list', 'create', 'update', 'delete']
  const wrapped = {}

  // 包装标准 CRUD 方法
  for (const op of operations) {
    if (db[tableName] && typeof db[tableName][op] === 'function') {
      wrapped[op] = wrapMethod(tableName, op, op)
    }
  }

  // 透传非标准方法（如 listByDate）
  if (db[tableName]) {
    for (const key of Object.keys(db[tableName])) {
      if (!wrapped[key] && typeof db[tableName][key] === 'function') {
        wrapped[key] = (...args) => db[tableName][key](...args)
      }
    }
  }

  return wrapped
}

// 创建 safeDb
export const safeDb = {
  plans: wrapTable('plans'),
  plansCategory: wrapTable('plansCategory'),
  monthlyPlans: wrapTable('monthlyPlans'),
  dailyPlans: wrapTable('dailyPlans'),
  habits: wrapTable('habits'),
  habit_logs: wrapTable('habit_logs'),
  tasks: wrapTable('tasks'),
  summaries: wrapTable('summaries'),
  dailyReportViews: wrapTable('dailyReportViews'),
  async rpc(name, params) {
    try {
      return await db.rpc(name, params)
    } catch (e) {
      console.error(`[safeDb] rpc ${name} failed:`, e)
      const { toast } = useToast()
      toast.error('批量操作失败')
      throw e  // 让调用方感知失败，避免继续执行 loadDailyPlans
    }
  }
}
