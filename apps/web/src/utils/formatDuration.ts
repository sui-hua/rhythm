/**
 * 将小时数转换为中文自然语言格式（如 "30分钟"、"1小时"、"1小时30分钟"）
 * null/undefined/0/负数统一返回 "0分钟"
 */
export function formatDuration(hours: number | null | undefined): string {
  if (!hours || hours <= 0) {
    return '0分钟'
  }

  // 先转为分钟再取整，避免浮点精度问题导致 "1小时60分钟"
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

// 将分钟数转换为中文自然语言格式，内部委托给 formatDuration
export function formatMinutes(minutes: number): string {
  return formatDuration(minutes / 60)
}
