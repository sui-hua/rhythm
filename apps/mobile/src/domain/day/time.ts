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