/**
 * @fileoverview 时间周期工具函数集
 * 提供日/周/月/年等时间周期的开始/结束时间计算，以及默认周期构建功能。
 * 所有时间均转换为本地时区的零点或末点，并输出 ISO 字符串格式。
 */

/**
 * 将给定日期转换为本地时区当日 00:00:00.000（该天零点）。
 * 用于获取"某一天的开始"时间戳。
 *
 * @param {Date} date - 任意日期对象
 * @returns {Date} 新的 Date 对象，时间为本地时区当日凌晨 0 点
 */
const toLocalStartOfDay = (date) => new Date(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
  0,
  0,
  0,
  0
)

/**
 * 将给定日期转换为本地时区当日 23:59:59.999（该天末点）。
 * 用于获取"某一天的结束"时间戳。
 *
 * @param {Date} date - 任意日期对象
 * @returns {Date} 新的 Date 对象，时间为本地时区当日 23:59:59.999
 */
const toLocalEndOfDay = (date) => new Date(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
  23,
  59,
  59,
  999
)

/**
 * 根据种类构建一个包含 periodStart 和 periodEnd 的周期对象，
 * 时间范围以 ISO 字符串形式返回。
 *
 * 支持的 kind：
 * - 'daily'   : 锚定日期当天
 * - 'monthly' : 锚定日期所在月（1日至月末）
 * - 'yearly'  : 锚定日期所在年（1月1日至12月31日）
 * - 其他/undefined : 默认返回以锚定日期为基准的完整星期（周一至周日）
 *
 * @param {'daily'|'monthly'|'yearly'|string} kind - 周期类型
 * @param {Date} [anchorDate=new Date()] - 锚定日期，默认为当前日期
 * @returns {{periodStart: string, periodEnd: string}} 周期对象，值为 ISO 字符串
 */
export const buildDefaultPeriod = (kind, anchorDate = new Date()) => {
  const base = new Date(anchorDate)

  if (kind === 'daily') {
    return {
      periodStart: toLocalStartOfDay(base).toISOString(),
      periodEnd: toLocalEndOfDay(base).toISOString()
    }
  }

  if (kind === 'monthly') {
    const start = new Date(base.getFullYear(), base.getMonth(), 1)
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0)

    return {
      periodStart: toLocalStartOfDay(start).toISOString(),
      periodEnd: toLocalEndOfDay(end).toISOString()
    }
  }

  if (kind === 'yearly') {
    const start = new Date(base.getFullYear(), 0, 1)
    const end = new Date(base.getFullYear(), 11, 31)

    return {
      periodStart: toLocalStartOfDay(start).toISOString(),
      periodEnd: toLocalEndOfDay(end).toISOString()
    }
  }

  const day = base.getDay() || 7
  const monday = new Date(base)
  monday.setDate(base.getDate() - day + 1)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    periodStart: toLocalStartOfDay(monday).toISOString(),
    periodEnd: toLocalEndOfDay(sunday).toISOString()
  }
}
