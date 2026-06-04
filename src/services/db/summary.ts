/**
 * @fileoverview Summaries 数据库服务模块
 *
 * 提供总结数据（Summary）的 CRUD 操作封装，基于 Supabase 数据库。
 * 支持按 kind（daily/weekly/monthly/yearly）维度查询和持久化总结记录。
 */

import client from '@/services/supabase'
import { mapSummaryRowToRecord } from '@/views/summary/utils/summaryAdapters'
import { TABLES } from './tables'

// Summary 数据接口
export interface Summary {
  id?: string | number
  kind: 'daily' | 'weekly' | 'monthly' | 'yearly'
  period_start?: string
  period_end?: string
  content?: Record<string, any>
  created_at?: string
  updated_at?: string
}

// Summary 创建/更新参数
export interface SummaryPayload {
  id?: string | number
  kind: 'daily' | 'weekly' | 'monthly' | 'yearly'
  period_start: string
  period_end?: string
  content?: Record<string, any>
}

const table = TABLES.SUMMARY

/**
 * 持久化总结记录（插入或更新）
 * @param payload - 总结记录数据
 * @returns 持久化后的记录（经 mapSummaryRowToRecord 转换）
 */
const persistSummary = async (payload: SummaryPayload): Promise<Summary> => {
  const query = payload.id
    ? client.from(table).update(payload).eq('id', payload.id)
    : client.from(table).insert(payload)

  const { data, error } = await query.select().single()

  if (error) throw error
  return mapSummaryRowToRecord(data)
}

export const summary = {
  /**
   * 根据 kind 类型查询总结列表
   * @param kind - 总结类型（daily/weekly/monthly/yearly）
   * @returns 总结记录数组
   */
  async listByKind(kind: Summary['kind']): Promise<Summary[]> {
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('kind', kind)
      .order('period_start', { ascending: false })

    if (error) throw error
    return (data || []).map(mapSummaryRowToRecord)
  },

  /**
   * 保存（创建或更新）总结记录
   * @param payload - 总结记录数据
   * @returns 保存后的记录
   */
  async save(payload: SummaryPayload): Promise<Summary> {
    return await persistSummary(payload)
  },

  /**
   * 删除指定 ID 的总结记录
   * @param id - 要删除的记录 ID
   */
  async remove(id: string | number): Promise<void> {
    const { error } = await client.from(table).delete().eq('id', id)
    if (error) throw error
  }
}
