/**
 * ============================================
 * 路由日期解析 (views/day/utils/routeDateContext.ts)
 * ============================================
 *
 * 【模块职责】
 * - 从路由参数中解析日期、月份、年份数值
 * - 校验解析结果是否与原始参数一致（isCanonical）
 * - 提供日期路径构建工具函数
 */

import type { RouteDateContext, RouteYearContext, RouteMonthContext } from './types'

// 路由参数对象：键为字符串，值为字符串、字符串数组或 undefined
interface RouteParams {
  year?: string | string[]
  month?: string | string[]
  day?: string | string[]
  [key: string]: string | string[] | undefined
}

// 解析路由参数中的数字，无效返回 null
const toIntegerOrNull = (value: string | string[] | undefined): number | null => {
  const strValue = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(strValue ?? '', 10)
  return Number.isFinite(parsed) ? parsed : null
}

export const getRouteDateContext = (params: RouteParams = {}, fallbackDate: Date = new Date()): RouteDateContext => {
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
  // 校验：反向构建的日期字符串是否与原始路由参数一致
  const yearStr = Array.isArray(params.year) ? params.year[0] : params.year
  const monthStr = Array.isArray(params.month) ? params.month[0] : params.month
  const dayStr = Array.isArray(params.day) ? params.day[0] : params.day
  const isCanonical = hasParsedParams
    && String(date.getFullYear()) === yearStr
    && String(date.getMonth() + 1) === monthStr
    && String(date.getDate()) === dayStr

  return {
    year,
    month,
    day,
    date,
    hasParsedParams,
    isCanonical
  }
}

export const getRouteYearContext = (yearParam: string | string[] | undefined, fallbackYear: number = new Date().getFullYear()): RouteYearContext => {
  const parsedYear = toIntegerOrNull(yearParam)

  if (parsedYear === null) {
    return {
      year: fallbackYear,
      hasParsedYear: false,
      isCanonical: false
    }
  }

  const date = new Date(parsedYear, 0, 1)
  const yearStr = Array.isArray(yearParam) ? yearParam[0] : yearParam

  return {
    year: parsedYear,
    hasParsedYear: true,
    isCanonical: String(date.getFullYear()) === yearStr
  }
}

export const getRouteMonthContext = (yearParam: string | string[] | undefined, monthParam: string | string[] | undefined, fallbackDate: Date = new Date()): RouteMonthContext => {
  const fallbackYear = fallbackDate.getFullYear()
  const fallbackMonth = fallbackDate.getMonth() + 1

  const parsedYear = toIntegerOrNull(yearParam)
  const parsedMonth = toIntegerOrNull(monthParam)

  const year = parsedYear ?? fallbackYear
  const month = parsedMonth ?? fallbackMonth
  const hasParsedYear = parsedYear !== null
  const hasParsedParams = parsedYear !== null && parsedMonth !== null
  const date = new Date(year, month - 1, 1)
  // 校验：反向构建的年月字符串是否与原始路由参数一致
  const yearStr = Array.isArray(yearParam) ? yearParam[0] : yearParam
  const monthStr = Array.isArray(monthParam) ? monthParam[0] : monthParam
  const isCanonical = hasParsedParams
    && String(date.getFullYear()) === yearStr
    && String(date.getMonth() + 1) === monthStr

  return {
    year,
    month,
    hasParsedYear,
    hasParsedParams,
    isCanonical
  }
}

export const buildDayPath = (date: Date): string => {
  return `/day/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

export const buildMonthPath = (year: number, month: number): string => {
  return `/month/${year}/${month}`
}

export const buildYearPath = (year: number): string => {
  return `/year/${year}`
}
