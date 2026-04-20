/**
 * @fileoverview Summaries 数据库服务模块
 * 
 * 提供总结数据（Summary）的 CRUD 操作封装，基于 Supabase 数据库。
 * 支持按 kind（daily/weekly/monthly/yearly）维度查询和持久化总结记录。
 * 
 * @module services/db/summaries
 * @see {@link https://supabase.com/docs} Supabase 文档
 */

import client from '@/config/supabase'
import { trackGlobalLoading } from '@/composables/useGlobalLoading'
import { mapSummaryRowToRecord } from '@/views/summary/utils/summaryAdapters'

/** @type {string} summaries 表名 */
const table = 'summaries'

/**
 * 允许的时间范围 scope 枚举值集合
 * 用于验证 scope 参数的合法性
 * @type {Set<string>}
 */
const allowedScopes = new Set(['year', 'quarter', 'month', 'week'])

/**
 * 旧版 kind 到 scope 的映射表
 * 将 daily/weekly/monthly/yearly 映射为对应的 scope 值
 * 用于兼容历史数据结构
 * @type {Object.<string, string>}
 */
const kindToLegacyScope = {
  daily: 'week',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year'
}

/**
 * 标准化 scope 值
 * 
 * 将不规范的 scope 值转换为标准值：
 * - 'day' 转换为 'week'（兼容旧数据）
 * - 无效值返回 null
 * 
 * @param {string} scope - 原始 scope 值
 * @returns {string|null} 标准化后的 scope 值，或 null（无效时）
 */
const normalizeScope = (scope) => {
  if (scope === 'day') return 'week'
  return allowedScopes.has(scope) ? scope : null
}

/**
 * 桥接旧版 scope 字段
 * 
 * 检查 payload 中的 scope 和 kind 字段，
 * 如果 scope 无效但 kind 有对应映射，则补充正确的 scope 值。
 * 确保数据持久化时 scope 字段符合数据库约束。
 * 
 * @param {Object} payload - 待处理的 payload 对象
 * @param {string} [payload.scope] - 当前 scope 值
 * @param {string} [payload.kind] - 当前 kind 值
 * @returns {Object} 处理后的 payload，scope 字段已确保有效
 */
const bridgeLegacyScope = (payload) => {
  if (!payload || typeof payload !== 'object') return payload

  const legacyScope = normalizeScope(payload.scope) ?? kindToLegacyScope[payload.kind]
  if (!legacyScope) return payload

  return {
    ...payload,
    scope: legacyScope
  }
}

/**
 * 持久化总结记录（插入或更新）
 * 
 * 根据 payload 是否包含 id 判断执行插入还是更新操作。
 * 自动调用 bridgeLegacyScope 处理 scope 兼容性问题。
 * 
 * @param {Object} payload - 总结记录数据
 * @param {string} [payload.id] - 记录 ID（存在则更新，不存在则插入）
 * @param {string} payload.kind - 总结类型（daily/weekly/monthly/yearly）
 * @param {string} [payload.scope] - 时间范围（year/quarter/month/week）
 * @param {string} payload.period_start - 周期开始日期
 * @param {string} [payload.period_end] - 周期结束日期
 * @param {Object} [payload.content] - 总结内容（JSON 格式）
 * @returns {Promise<Object>} 持久化后的记录（经 mapSummaryRowToRecord 转换）
 * @throws {Error} Supabase 查询错误
 */
const persistSummary = async (payload) => {
  const bridgedPayload = bridgeLegacyScope(payload)
  const query = payload.id
    ? client.from(table).update(bridgedPayload).eq('id', payload.id)
    : client.from(table).insert(bridgedPayload)

  const { data, error } = await query.select().single()

  if (error) throw error
  return mapSummaryRowToRecord(data)
}

/**
 * Summaries 数据服务对象
 * 
 * 提供总结记录的查询、保存、删除等操作。
 * 所有操作自动包装全局加载状态跟踪。
 * 
 * @namespace summaries
 */
export const summaries = {
  /**
   * 根据 kind 类型查询总结列表
   * 
   * 从 summaries 表查询指定 kind 的所有记录，
   * 按 period_start 降序排列（最新在前）。
   * 
   * @memberof summaries
   * @param {string} kind - 总结类型（daily/weekly/monthly/yearly）
   * @returns {Promise<Array<Object>>} 总结记录数组
   * @throws {Error} Supabase 查询错误
   * 
   * @example
   * const weeklySummaries = await summaries.listByKind('weekly')
   */
  async listByKind(kind) {
    return await trackGlobalLoading(async () => {
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq('kind', kind)
        .order('period_start', { ascending: false })

      if (error) throw error
      return (data || []).map(mapSummaryRowToRecord)
    })
  },

  /**
   * 保存（创建或更新）总结记录
   * 
   * 自动判断是插入新记录还是更新已有记录：
   * - payload.id 存在 → 更新对应 ID 的记录
   * - payload.id 不存在 → 插入新记录
   * 
   * @memberof summaries
   * @param {Object} payload - 总结记录数据
   * @param {string} [payload.id] - 记录 ID（可选）
   * @param {string} payload.kind - 总结类型
   * @param {string} payload.period_start - 周期开始日期
   * @param {Object} [payload.content] - 总结内容
   * @returns {Promise<Object>} 保存后的记录
   * @throws {Error} Supabase 查询错误
   * 
   * @example
   * // 创建新记录
   * const newSummary = await summaries.save({ kind: 'weekly', period_start: '2024-01-01', content: {...} })
   * 
   * @example
   * // 更新已有记录
   * const updated = await summaries.save({ id: 'xxx', kind: 'weekly', period_start: '2024-01-01', content: {...} })
   */
  async save(payload) {
    return await trackGlobalLoading(async () => persistSummary(payload))
  },

  /**
   * 删除指定 ID 的总结记录
   * 
   * @memberof summaries
   * @param {string} id - 要删除的记录 ID
   * @returns {Promise<void>} 删除操作完成（无返回值）
   * @throws {Error} Supabase 查询错误
   * 
   * @example
   * await summaries.remove('record-id-123')
   */
  async remove(id) {
    return await trackGlobalLoading(async () => {
      const { error } = await client.from(table).delete().eq('id', id)
      if (error) throw error
    })
  }
}
