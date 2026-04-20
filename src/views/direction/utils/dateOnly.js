/**
 * @fileoverview 日期字符串（YYYY-MM-DD）解析与提取工具模块
 * @module direction/utils/dateOnly
 *
 * 本模块提供将 "YYYY-MM-DD" 格式的日期字符串解析为 JavaScript Date 对象的功能，
 * 以及从日期字符串中提取年、月、日各部分的方法。
 * 适用于 Supabase DATE 类型在前端的一致处理。
 */

/**
 * 匹配 "YYYY-MM-DD" 格式日期字符串的正则表达式
 * - 年份：4位数字
 * - 月份：2位数字（01-12）
 * - 日期：2位数字（01-31）
 * @type {RegExp}
 */
const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * 将 "YYYY-MM-DD" 格式的日期字符串解析为 JavaScript Date 对象
 *
 * @param {unknown} dateString - 日期字符串，支持 "YYYY-MM-DD" 格式
 * @returns {Date|null} 解析成功返回 JavaScript Date 对象（本地时区，00:00:00）；
 *                      格式错误、类型不为 string、或日期非法时返回 null
 *
 * @example
 * parseDateOnly('2024-03-15') // => Date(2024, 2, 15) （本地时区）
 * parseDateOnly('2024-13-01') // => null （月份超出范围）
 * parseDateOnly(null)         // => null
 * parseDateOnly('')          // => null
 */
export const parseDateOnly = (dateString) => {
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
 * 从 "YYYY-MM-DD" 格式的日期字符串中提取年份
 *
 * @param {unknown} dateString - 日期字符串，支持 "YYYY-MM-DD" 格式
 * @returns {number|null} 解析成功返回 4 位年份数字（如 2024）；解析失败返回 null
 *
 * @example
 * getDateOnlyYear('2024-03-15') // => 2024
 * getDateOnlyYear('invalid')    // => null
 */
export const getDateOnlyYear = (dateString) => {
  const parsed = parseDateOnly(dateString)
  return parsed ? parsed.getFullYear() : null
}

/**
 * 从 "YYYY-MM-DD" 格式的日期字符串中提取月份
 *
 * @param {unknown} dateString - 日期字符串，支持 "YYYY-MM-DD" 格式
 * @returns {number|null} 解析成功返回 1-12 的月份数字；解析失败返回 null
 *
 * @example
 * getDateOnlyMonth('2024-03-15') // => 3
 * getDateOnlyMonth('2024-12-01') // => 12
 * getDateOnlyMonth('invalid')   // => null
 */
export const getDateOnlyMonth = (dateString) => {
  const parsed = parseDateOnly(dateString)
  return parsed ? parsed.getMonth() + 1 : null
}

/**
 * 从 "YYYY-MM-DD" 格式的日期字符串中提取日期（天）
 *
 * @param {unknown} dateString - 日期字符串，支持 "YYYY-MM-DD" 格式
 * @returns {number|null} 解析成功返回 1-31 的日期数字；解析失败返回 null
 *
 * @example
 * getDateOnlyDay('2024-03-15') // => 15
 * getDateOnlyDay('2024-01-01') // => 1
 * getDateOnlyDay('invalid')    // => null
 */
export const getDateOnlyDay = (dateString) => {
  const parsed = parseDateOnly(dateString)
  return parsed ? parsed.getDate() : null
}
