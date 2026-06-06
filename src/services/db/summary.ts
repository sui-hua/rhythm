/**
 * @fileoverview Summaries 数据库服务模块
 *
 * 提供总结数据（Summary）的 CRUD 操作封装，基于 Supabase 数据库。
 * 基础 CRUD 由 createBase 工厂生成，自定义查询方法保留业务语义。
 * 支持按 kind（daily/weekly/monthly/yearly）维度查询和持久化总结记录。
 */

import { createBase } from '@/services/supabase'
import { mapSummaryRowToRecord } from '@/services/db/summaryAdapters'
import type { SummaryRow } from '@/services/db/summaryAdapters'
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

// 通过 createBase 获取基础 CRUD 能力（list / getById / create / update / delete / query）
const supabase = createBase<Summary>(TABLES.SUMMARY)

export const summary = {
  /**
   * 获取基础 CRUD 对象，供外部直接调用标准操作
   */
  ...supabase,

  /**
   * 根据 kind 类型查询总结列表
   * @param kind - 总结类型（daily/weekly/monthly/yearly）
   * @returns 总结记录数组（经 mapSummaryRowToRecord 转换）
   */
  async listByKind(kind: Summary['kind']): Promise<Summary[]> {
    // query 返回原始行数据，需经 mapSummaryRowToRecord 转换为前端格式
    const data = await supabase.query<SummaryRow>(q =>
      q.select('*').eq('kind', kind).order('period_start', { ascending: false })
    )
    return (data || []).map(mapSummaryRowToRecord)
  },

  /**
   * 根据日期和类型查询总结记录
   * @param date - 日期字符串（YYYY-MM-DD 格式或 ISO 字符串）
   * @param kind - 总结类型（daily/weekly/monthly/yearly）
   * @returns 匹配的总结记录，无匹配时返回 null
   */
  async getByDateKind(date: string, kind: Summary['kind']): Promise<Summary | null> {
    const rows = await supabase.query<SummaryRow>(q =>
      q.select('*').eq('kind', kind).lte('period_start', date).gte('period_end', date).limit(1)
    )
    return rows?.length ? mapSummaryRowToRecord(rows[0]!) : null
  },

  /**
   * 创建总结记录
   * @param payload - 总结记录数据（不含 id）
   * @returns 创建后的记录
   */
  async create(payload: SummaryPayload): Promise<Summary> {
    return await supabase.create<Summary>(payload)
  },

  /**
   * 更新总结记录
   * @param id - 记录 ID
   * @param payload - 要更新的字段
   * @returns 更新后的记录
   */
  async update(id: string | number, payload: Partial<SummaryPayload>): Promise<Summary> {
    return await supabase.update<Summary>(id, payload)
  }
}
