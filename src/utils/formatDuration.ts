/**
 * ============================================
 * 时长格式化工具 (utils/formatDuration.ts)
 * ============================================
 *
 * 【模块职责】
 * - 将小时/分钟数转换为中文自然语言格式
 *
 * 【函数说明】
 * - formatDuration()  → 小时数 → 中文格式（如 "1小时30分钟"）
 * - formatMinutes()   → 分钟数 → 中文格式
 */

/**
 * 将小时数转换为中文自然语言格式
 * @param hours - 小时数，支持小数
 * @returns 中文格式，如 "30分钟"、"1小时"、"3小时30分钟"
 */
export function formatDuration(hours: number | null | undefined): string {
  if (!hours || hours <= 0) {
    return '0分钟'
  }

  const totalMinutes = Math.round(hours * 60)

  if (totalMinutes < 60) {
    return `${totalMinutes}分钟`
  }

  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60

  if (m === 0) {
    return `${h}小时`
  }

  return `${h}小时${m}分钟`
}

/**
 * 将分钟数转换为中文自然语言格式
 * @param minutes - 分钟数
 * @returns 中文格式
 */
export function formatMinutes(minutes: number): string {
  return formatDuration(minutes / 60)
}
