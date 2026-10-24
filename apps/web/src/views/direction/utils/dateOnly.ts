/**
 * 日期字符串解析工具：处理数据库中的 date-only 字符串（如 '2026-04-01'）。
 * 所有函数对无效输入安全返回 null，不会抛出异常。
 */

// 匹配 YYYY-MM-DD 格式的正则
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * 将 date-only 字符串解析为本地 Date 对象。
 * 返回 null 表示输入无效或解析失败。
 */
export const parseDateOnly = (dateString: string | unknown): Date | null => {
  if (typeof dateString !== 'string') return null

  const match = DATE_ONLY_RE.exec(dateString)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * 从 date-only 字符串中提取年份。
 */
export const getDateOnlyYear = (dateString: string | unknown): number | null => {
  const parsed = parseDateOnly(dateString)
  return parsed ? parsed.getFullYear() : null
}

/**
 * 从 date-only 字符串中提取月份（1-12）。
 */
export const getDateOnlyMonth = (dateString: string | unknown): number | null => {
  const parsed = parseDateOnly(dateString)
  return parsed ? parsed.getMonth() + 1 : null
}

/**
 * 从 date-only 字符串中提取日（1-31）。
 */
export const getDateOnlyDay = (dateString: string | unknown): number | null => {
  const parsed = parseDateOnly(dateString)
  return parsed ? parsed.getDate() : null
}
