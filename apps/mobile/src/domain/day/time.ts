export function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function parseClockToMinutes(clock: string | null | undefined) {
  if (!clock) return null

  const [hourText, minuteText] = clock.split(':')
  const hours = Number(hourText)
  const minutes = Number(minuteText)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null

  return hours * 60 + minutes
}

export function parseIsoToDayMinutes(value: string | null | undefined) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.getHours() * 60 + date.getMinutes()
}

export function formatMinutesAsClock(minutes: number | null) {
  if (minutes === null) return ''

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

export function addMinutes(minutes: number | null, duration: number | null) {
  if (minutes === null || duration === null) return null
  return minutes + duration
}

/** 日期加减天数，返回新 Date，不修改入参 */
export function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

/** 所在周的周一 00:00（中文习惯以周一为一周起点） */
export function getWeekStart(date: Date) {
  const next = new Date(date)
  const weekday = next.getDay()
  const offset = weekday === 0 ? 6 : weekday - 1
  next.setDate(next.getDate() - offset)
  next.setHours(0, 0, 0, 0)
  return next
}

export function isSameDay(a: Date, b: Date) {
  return toDateKey(a) === toDateKey(b)
}
