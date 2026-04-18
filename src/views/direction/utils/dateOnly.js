const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

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

export const getDateOnlyYear = (dateString) => {
  const parsed = parseDateOnly(dateString)
  return parsed ? parsed.getFullYear() : null
}

export const getDateOnlyMonth = (dateString) => {
  const parsed = parseDateOnly(dateString)
  return parsed ? parsed.getMonth() + 1 : null
}

export const getDateOnlyDay = (dateString) => {
  const parsed = parseDateOnly(dateString)
  return parsed ? parsed.getDate() : null
}
