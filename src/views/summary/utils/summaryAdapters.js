/**
 * @fileoverview Summary 模块数据适配器
 * @description 提供总结数据在不同格式之间的转换能力，包括：
 * - 数据库记录与前端记录之间的映射
 * - 统一载荷格式的转换
 * - 内容（content）字段的规范化处理
 *
 * @module summaryAdapters
 */

import { buildDefaultPeriod } from '@/views/summary/utils/summaryPeriods'

/**
 * 判断给定值是否为纯对象（即普通对象，非数组、非 null）
 * @param {unknown} value - 待检测的值
 * @returns {boolean} - 如果是普通对象则返回 true
 */
const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

/**
 * 规范化内容字段
 * 
 * 统一处理 summary.content 的多种可能格式，确保返回标准对象结构。
 * content 可以是字符串（旧格式）或其他对象结构。
 * 
 * @param {string|object|null|undefined} content - 原始 content 值
 * @returns {{ text?: string } | {}} - 标准化后的 content 对象
 * 
 * @example
 * normalizeContent('some text')        // => { text: 'some text' }
 * normalizeContent({ text: 'hello' }) // => { text: 'hello' }
 * normalizeContent(null)              // => {}
 */
const normalizeContent = (content) => {
  if (typeof content === 'string') {
    return { text: content }
  }

  if (isPlainObject(content)) {
    return content
  }

  return {}
}


/**
 * 检查 summary 是否已是统一载荷格式
 * 
 * 统一载荷包含 kind、period_start、period_end 和 content 字段。
 * 如果已满足这些条件，说明是新格式数据，不需要进一步转换。
 * 
 * @param {object} summary - Summary 对象
 * @returns {boolean} - 是否为统一载荷格式
 */
const isUnifiedPayload = (summary) => (
  isPlainObject(summary)
  && typeof summary.kind === 'string'
  && typeof summary.period_start === 'string'
  && typeof summary.period_end === 'string'
  && Object.prototype.hasOwnProperty.call(summary, 'content')
)

/**
 * 从 summary 对象中解析 kind 类型
 *
 * @param {object} summary - Summary 对象
 * @returns {string} - Summary 类型（daily/weekly/monthly/yearly）
 * @throws {Error} - 当缺少 kind 时抛出
 */
const resolveKind = (summary) => {
  if (typeof summary.kind === 'string') return summary.kind

  throw new Error('Summary payload is missing kind')
}

/**
 * 解析时间周期信息
 * 
 * 优先使用显式的 period_start 和 period_end 字段；
 * 如果缺失，则根据 kind 类型和 created_at 时间戳生成默认周期。
 * 
 * @param {object} summary - Summary 对象
 * @param {string} kind - Summary 类型
 * @returns {{ periodStart: string, periodEnd: string }} - 周期起止时间
 */
const resolvePeriod = (summary, kind) => {
  if (typeof summary.period_start === 'string' && typeof summary.period_end === 'string') {
    return {
      periodStart: summary.period_start,
      periodEnd: summary.period_end
    }
  }

  return buildDefaultPeriod(kind, summary.created_at ? new Date(summary.created_at) : new Date())
}

/**
 * 从 summary 和 kind 解析表单数据
 *
 * 将 summary 的各字段和 content 内的字段合并，提取出表单所需的数据。
 * daily 类型使用 done/improve/tomorrow 字段，其他类型使用 title/text 字段。
 *
 * @param {object} summary - Summary 对象
 * @param {string} kind - Summary 类型
 * @returns {object} - 表单数据对象
 */
const resolveFormData = (summary, kind) => {
  const content = normalizeContent(summary.content)

  if (kind === 'daily') {
    return {
      done: summary.done ?? content.done ?? '',
      improve: summary.improve ?? content.improve ?? '',
      tomorrow: summary.tomorrow ?? content.tomorrow ?? ''
    }
  }

  return {
    title: summary.title ?? '',
    text: summary.text ?? content.text ?? ''
  }
}

/**
 * 将数据库行数据映射为前端记录格式
 *
 * 用于从 Supabase 查询返回的原始行数据转换为前端使用的标准记录格式。
 * 同时对 content 字段进行规范化处理。
 *
 * @param {object} row - 数据库行对象
 * @returns {object} - 转换后的前端记录对象
 *
 * @example
 * // 输入：数据库行
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
 * // 输出：前端记录
 * {
 *   id: 1,
 *   user_id: 'user-123',
 *   kind: 'daily',
 *   period_start: '2024-01-01',
 *   period_end: '2024-01-01',
 *   title: null,
 *   content: { done: 'task1', improve: 'task2' },
 *   created_at: '2024-01-01T00:00:00Z',
 *   updated_at: '2024-01-01T00:00:00Z'
 * }
 */
export const mapSummaryRowToRecord = (row) => ({
  id: row.id,
  user_id: row.user_id,
  kind: row.kind,
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
 * @param {object} params - 构建参数
 * @param {string} params.kind - Summary 类型
 * @param {string} params.userId - 用户 ID
 * @param {{ periodStart: string, periodEnd: string }} params.period - 时间周期
 * @param {object} params.formData - 表单数据
 * @param {object} [params.existingRecord] - 已存在的记录（用于更新时保留 id）
 * @returns {object} - 数据库载荷对象
 *
 * @example
 * buildSummaryPayload({
 *   kind: 'daily',
 *   userId: 'user-123',
 *   period: { periodStart: '2024-01-01', periodEnd: '2024-01-01' },
 *   formData: { done: 'task1', improve: 'improve1', tomorrow: 'plan1' }
 * })
 * // => {
 *   user_id: 'user-123',
 *   kind: 'daily',
 *   period_start: '2024-01-01',
 *   period_end: '2024-01-01',
 *   title: null,
 *   content: { done: 'task1', improve: 'improve1', tomorrow: 'plan1' }
 * }
 */
export const buildSummaryPayload = ({ kind, userId, period, formData, existingRecord }) => {
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
 * @param {object} summary - 原始 summary 数据
 * @returns {object} - 统一载荷格式的 summary 对象
 *
 * @example
 * toUnifiedSummaryPayload({
 *   kind: 'daily',
 *   period_start: '2024-01-01',
 *   period_end: '2024-01-01',
 *   content: { done: 'task1' }
 * })
 */
export const toUnifiedSummaryPayload = (summary) => {
  if (isUnifiedPayload(summary)) {
    return {
      ...summary,
      content: normalizeContent(summary.content)
    }
  }

  const kind = resolveKind(summary)
  const period = resolvePeriod(summary, kind)
  const formData = resolveFormData(summary, kind)

  return buildSummaryPayload({
    kind,
    userId: summary.user_id ?? summary.userId,
    period,
    formData,
    existingRecord: summary.id ? { id: summary.id } : null
  })
}
