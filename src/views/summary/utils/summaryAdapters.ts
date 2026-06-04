/**
 * @fileoverview Summary 模块数据适配器
 * @description 提供总结数据在不同格式之间的转换能力，包括：
 * - 数据库记录与前端记录之间的映射
 * - 统一载荷格式的转换
 * - 内容（content）字段的规范化处理
 *
 * @module summaryAdapters
 */

import type { Period, SummaryKind } from './summaryPeriods'
import { buildDefaultPeriod } from './summaryPeriods'

// 内容对象类型，支持自由键值对
interface ContentObject {
  [key: string]: string | undefined
}

// 数据库行原始数据接口
export interface SummaryRow {
  id?: string | number
  user_id?: string
  kind?: string
  period_start?: string
  period_end?: string
  title?: string | null
  content?: string | ContentObject | null
  created_at?: string
  updated_at?: string | null
}

// 前端记录格式接口
export interface SummaryRecord {
  id?: string | number
  user_id?: string
  kind: SummaryKind
  period_start?: string
  period_end?: string
  title?: string | null
  content?: ContentObject
  created_at?: string
  updated_at?: string
}

// buildSummaryPayload 参数接口
export interface BuildSummaryPayloadParams {
  kind: SummaryKind
  userId: string
  period: Period
  formData: Record<string, string>
  existingRecord?: { id?: string | number } | null
}

// buildSummaryPayload 返回的数据库载荷接口
export interface SummaryPayloadRecord {
  id?: string | number
  user_id: string
  kind: SummaryKind
  period_start: string
  period_end: string
  title: string | null
  content: Record<string, any>
}

/**
 * 判断给定值是否为纯对象（即普通对象，非数组、非 null）
 * @param value - 待检测的值
 * @returns 如果是普通对象则返回 true
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

/**
 * 规范化内容字段
 *
 * 统一处理 summary.content 的多种可能格式，确保返回标准对象结构。
 * content 可以是字符串（旧格式）或其他对象结构。
 *
 * @param content - 原始 content 值
 * @returns 标准化后的 content 对象
 *
 * @example
 * normalizeContent('some text')        // => { text: 'some text' }
 * normalizeContent({ text: 'hello' }) // => { text: 'hello' }
 * normalizeContent(null)              // => {}
 */
const normalizeContent = (content: string | ContentObject | null | undefined): ContentObject => {
  if (typeof content === 'string') {
    return { text: content }
  }

  if (isPlainObject(content)) {
    return content as ContentObject
  }

  return {}
}


/**
 * 检查 summary 是否已是统一载荷格式
 *
 * 统一载荷包含 kind、period_start、period_end 和 content 字段。
 * 如果已满足这些条件，说明是新格式数据，不需要进一步转换。
 *
 * @param summary - Summary 对象
 * @returns 是否为统一载荷格式
 */
const isUnifiedPayload = (summary: Record<string, unknown>): boolean => (
  isPlainObject(summary)
  && typeof summary.kind === 'string'
  && typeof summary.period_start === 'string'
  && typeof summary.period_end === 'string'
  && Object.prototype.hasOwnProperty.call(summary, 'content')
)

/**
 * 从 summary 对象中解析 kind 类型
 *
 * @param summary - Summary 对象
 * @returns Summary 类型（daily/weekly/monthly/yearly）
 * @throws 当缺少 kind 时抛出
 */
const resolveKind = (summary: Record<string, unknown>): SummaryKind => {
  if (typeof summary.kind === 'string') return summary.kind as SummaryKind

  throw new Error('Summary payload is missing kind')
}

/**
 * 解析时间周期信息
 *
 * 优先使用显式的 period_start 和 period_end 字段；
 * 如果缺失，则根据 kind 类型和 created_at 时间戳生成默认周期。
 *
 * @param summary - Summary 对象
 * @param kind - Summary 类型
 * @returns 周期起止时间
 */
const resolvePeriod = (summary: Record<string, unknown>, kind: string): Period => {
  if (typeof summary.period_start === 'string' && typeof summary.period_end === 'string') {
    return {
      periodStart: summary.period_start,
      periodEnd: summary.period_end
    }
  }

  return buildDefaultPeriod(kind, summary.created_at ? new Date(summary.created_at as string) : new Date())
}

/**
 * 从 summary 和 kind 解析表单数据
 *
 * 将 summary 的各字段和 content 内的字段合并，提取出表单所需的数据。
 * daily 类型使用 done/improve/tomorrow 字段，其他类型使用 title/text 字段。
 *
 * @param summary - Summary 对象
 * @param kind - Summary 类型
 * @returns 表单数据对象
 */
const resolveFormData = (summary: Record<string, unknown>, kind: string): Record<string, string> => {
  const content = normalizeContent(summary.content as string | ContentObject | null)

  if (kind === 'daily') {
    return {
      done: (summary.done as string) ?? content.done ?? '',
      improve: (summary.improve as string) ?? content.improve ?? '',
      tomorrow: (summary.tomorrow as string) ?? content.tomorrow ?? ''
    }
  }

  return {
    title: (summary.title as string) ?? '',
    text: (summary.text as string) ?? content.text ?? ''
  }
}

/**
 * 将数据库行数据映射为前端记录格式
 *
 * 用于从 Supabase 查询返回的原始行数据转换为前端使用的标准记录格式。
 * 同时对 content 字段进行规范化处理。
 *
 * @param row - 数据库行对象
 * @returns 转换后的前端记录对象
 *
 * @example
 * mapSummaryRowToRecord({
 *   id: 1,
 *   user_id: 'user-123',
 *   kind: 'daily',
 *   period_start: '2024-01-01',
 *   period_end: '2024-01-01',
 *   content: { done: 'task1', improve: 'task2' },
 *   created_at: '2024-01-01T00:00:00Z',
 *   updated_at: null
 * })
 */
export const mapSummaryRowToRecord = (row: SummaryRow): SummaryRecord => ({
  id: row.id,
  user_id: row.user_id,
  kind: row.kind as SummaryKind,
  period_start: row.period_start,
  period_end: row.period_end,
  title: row.title ?? null,
  content: normalizeContent(row.content),
  created_at: row.created_at,
  updated_at: row.updated_at ?? row.created_at
})

/**
 * 构建提交到数据库的 summary 载荷
 *
 * 根据 kind 类型和表单数据构建完整的数据库写入对象。
 * daily 类型使用特殊的 content 结构（done/improve/tomorrow），
 * 其他类型使用 title 和 text 字段。
 *
 * @param params - 构建参数
 * @returns 数据库载荷对象
 *
 * @example
 * buildSummaryPayload({
 *   kind: 'daily',
 *   userId: 'user-123',
 *   period: { periodStart: '2024-01-01', periodEnd: '2024-01-01' },
 *   formData: { done: 'task1', improve: 'improve1', tomorrow: 'plan1' }
 * })
 */
export const buildSummaryPayload = ({ kind, userId, period, formData, existingRecord }: BuildSummaryPayloadParams): SummaryPayloadRecord => {
  const isDaily = kind === 'daily'

  return {
    ...(existingRecord?.id ? { id: existingRecord.id } : {}),
    user_id: userId,
    kind,
    period_start: period.periodStart,
    period_end: period.periodEnd,
    title: isDaily ? null : (formData.title?.trim() || null),
    content: isDaily
      ? {
          done: formData.done || '',
          improve: formData.improve || '',
          tomorrow: formData.tomorrow || ''
        }
      : {
          text: formData.text || ''
        }
  }
}

/**
 * 将任意 summary 数据转换为统一载荷格式
 *
 * 核心转换函数，通过 resolveKind、resolvePeriod、resolveFormData 逐步解析转换。
 *
 * 这是将外部数据（如表单输入、API 返回等）统一为标准载荷的入口。
 *
 * @param summary - 原始 summary 数据
 * @returns 统一载荷格式的 summary 对象
 *
 * @example
 * toUnifiedSummaryPayload({
 *   kind: 'daily',
 *   period_start: '2024-01-01',
 *   period_end: '2024-01-01',
 *   content: { done: 'task1' }
 * })
 */
export const toUnifiedSummaryPayload = (summary: Record<string, unknown>): SummaryPayloadRecord => {
  if (isUnifiedPayload(summary)) {
    return {
      ...summary,
      content: normalizeContent(summary.content as string | ContentObject | null)
    } as SummaryPayloadRecord
  }

  const kind = resolveKind(summary)
  const period = resolvePeriod(summary, kind)
  const formData = resolveFormData(summary, kind)

  return buildSummaryPayload({
    kind,
    userId: (summary.user_id as string) ?? (summary.userId as string),
    period,
    formData,
    existingRecord: summary.id ? { id: summary.id as string | number } : null
  })
}
