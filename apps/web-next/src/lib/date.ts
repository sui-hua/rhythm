/** 日期工具：与移动端 `src/domain/day/time.ts` 同口径 */

export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

/** 周一为一周起点 */
export function getWeekStart(date: Date): Date {
  const next = new Date(date)
  const weekday = next.getDay()
  next.setDate(next.getDate() - (weekday === 0 ? 6 : weekday - 1))
  next.setHours(0, 0, 0, 0)
  return next
}

export const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function formatCNDate(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/** 2026-10-30 → 10月30日 */
export function formatCNDateKey(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  if (!month || !day) return dateKey
  return `${Number(month)}月${Number(day)}日`
}

/** 从 ISO 取当天的 HH:mm */
export function formatIsoAsClock(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** 'HH:mm:ss' → 当天分钟数 */
export function parseClockToMinutes(clock: string | null): number | null {
  if (!clock) return null
  const [h, m] = clock.split(':')
  const hours = Number(h)
  const minutes = Number(m)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

export function formatMinutesAsClock(minutes: number | null): string {
  if (minutes === null) return ''
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}
