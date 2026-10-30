/** 界面用的日期格式化。纯函数，原先散落在 mocks 里，现归入领域层。 */

export const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 10月30日 */
export function formatCNDate(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/** 2026-10-30 → 10月30日，避免再 parse 一次时区 */
export function formatCNDateKey(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  if (!month || !day) return dateKey
  return `${Number(month)}月${Number(day)}日`
}
