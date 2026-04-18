const toIntegerOrNull = (value) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export const getRouteDateContext = (params = {}, fallbackDate = new Date()) => {
  const fallbackYear = fallbackDate.getFullYear()
  const fallbackMonth = fallbackDate.getMonth() + 1
  const fallbackDay = fallbackDate.getDate()

  const parsedYear = toIntegerOrNull(params.year)
  const parsedMonth = toIntegerOrNull(params.month)
  const parsedDay = toIntegerOrNull(params.day)

  const year = parsedYear ?? fallbackYear
  const month = parsedMonth ?? fallbackMonth
  const day = parsedDay ?? fallbackDay
  const date = new Date(year, month - 1, day)
  const hasParsedParams = parsedYear !== null && parsedMonth !== null && parsedDay !== null
  const isCanonical = hasParsedParams
    && String(date.getFullYear()) === String(params.year)
    && String(date.getMonth() + 1) === String(params.month)
    && String(date.getDate()) === String(params.day)

  return {
    year,
    month,
    day,
    date,
    hasParsedParams,
    isCanonical
  }
}

export const getRouteYearContext = (yearParam, fallbackYear = new Date().getFullYear()) => {
  const parsedYear = toIntegerOrNull(yearParam)

  if (parsedYear === null) {
    return {
      year: fallbackYear,
      hasParsedYear: false,
      isCanonical: false
    }
  }

  const date = new Date(parsedYear, 0, 1)

  return {
    year: parsedYear,
    hasParsedYear: true,
    isCanonical: String(date.getFullYear()) === String(yearParam)
  }
}

export const getRouteMonthContext = (yearParam, monthParam, fallbackDate = new Date()) => {
  const fallbackYear = fallbackDate.getFullYear()
  const fallbackMonth = fallbackDate.getMonth() + 1

  const parsedYear = toIntegerOrNull(yearParam)
  const parsedMonth = toIntegerOrNull(monthParam)

  const year = parsedYear ?? fallbackYear
  const month = parsedMonth ?? fallbackMonth
  const hasParsedYear = parsedYear !== null
  const hasParsedParams = parsedYear !== null && parsedMonth !== null
  const date = new Date(year, month - 1, 1)
  const isCanonical = hasParsedParams
    && String(date.getFullYear()) === String(yearParam)
    && String(date.getMonth() + 1) === String(monthParam)

  return {
    year,
    month,
    hasParsedYear,
    hasParsedParams,
    isCanonical
  }
}

export const buildDayPath = (date) => {
  return `/day/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

export const buildMonthPath = (year, month) => {
  return `/month/${year}/${month}`
}

export const buildYearPath = (year) => {
  return `/year/${year}`
}
