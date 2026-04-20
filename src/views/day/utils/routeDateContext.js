/**
 * ============================================
 * 路由日期上下文解析 (views/day/utils/routeDateContext.js)
 * ============================================
 *
 * 【模块职责】
 * - 解析路由参数中的年/月/日
 * - 提供日期合法性校验
 * - 生成各视图的路由路径
 *
 * 【工具函数】
 * - getRouteDateContext()   → 解析日视图路由参数
 * - getRouteYearContext()   → 解析年视图路由参数
 * - getRouteMonthContext()  → 解析月视图路由参数
 * - buildDayPath()          → 构建日视图路径
 * - buildMonthPath()        → 构建月视图路径
 * - buildYearPath()         → 构建年视图路径
 */

/**
 * 解析路由参数中的数字，无效返回 null
 * @param {string|number|undefined} value - 路由参数值
 * @returns {number|null} 解析后的整数，无效返回 null
 */
const toIntegerOrNull = (value) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * 解析日视图路由参数
 * @param {object} params - 路由参数对象 { year, month, day }
 * @param {Date} [fallbackDate=new Date()] - 兜底日期（默认今天）
 * @returns {{
 *   year: number,
 *   month: number,
 *   day: number,
 *   date: Date,
 *   hasParsedParams: boolean,
 *   isCanonical: boolean
 * }} 解析后的日期上下文
 */
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

/**
 * 解析年视图路由参数
 * @param {string|number|undefined} yearParam - 年份路由参数
 * @param {number} [fallbackYear=new Date().getFullYear()] - 兜底年份
 * @returns {{
 *   year: number,
 *   hasParsedYear: boolean,
 *   isCanonical: boolean
 * }} 解析后的年份上下文
 */
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

/**
 * 解析月视图路由参数
 * @param {string|number|undefined} yearParam - 年份路由参数
 * @param {string|number|undefined} monthParam - 月份路由参数
 * @param {Date} [fallbackDate=new Date()] - 兜底日期
 * @returns {{
 *   year: number,
 *   month: number,
 *   hasParsedYear: boolean,
 *   hasParsedParams: boolean,
 *   isCanonical: boolean
 * }} 解析后的月份上下文
 */
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

/**
 * 构建日视图路径
 * @param {Date} date - 日期对象
 * @returns {string} 日视图路由路径，格式：/day/{year}/{month}/{day}
 */
export const buildDayPath = (date) => {
  return `/day/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * 构建月视图路径
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {string} 月视图路由路径，格式：/month/{year}/{month}
 */
export const buildMonthPath = (year, month) => {
  return `/month/${year}/${month}`
}

/**
 * 构建年视图路径
 * @param {number} year - 年份
 * @returns {string} 年视图路由路径，格式：/year/{year}
 */
export const buildYearPath = (year) => {
  return `/year/${year}`
}
