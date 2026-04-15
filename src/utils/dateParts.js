/**
 * 日期解析工具
 * 从字符串或 Date 对象中提取 ISO 格式的 year/month/day
 */
export function getIsoDateParts(value) {
  if (!value) return null

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3])
      }
    }
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  }
}

export function getIsoMonth(value) {
  return getIsoDateParts(value)?.month ?? null
}

export function getIsoDay(value) {
  return getIsoDateParts(value)?.day ?? null
}

export function getIsoYear(value) {
  return getIsoDateParts(value)?.year ?? null
}
