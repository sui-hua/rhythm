const toLocalStartOfDay = (date) => new Date(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
  0,
  0,
  0,
  0
)

const toLocalEndOfDay = (date) => new Date(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
  23,
  59,
  59,
  999
)

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
