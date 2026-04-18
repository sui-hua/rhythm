import { describe, expect, it } from 'vitest'
import {
  buildDayPath,
  buildMonthPath,
  buildYearPath,
  getRouteDateContext,
  getRouteMonthContext,
  getRouteYearContext
} from '@/views/day/utils/routeDateContext'

describe('routeDateContext', () => {
  it('从完整 year/month/day 路由解析目标日期', () => {
    const context = getRouteDateContext({
      year: '2027',
      month: '1',
      day: '1'
    })

    expect(context.year).toBe(2027)
    expect(context.month).toBe(1)
    expect(context.day).toBe(1)
    expect(context.date.getFullYear()).toBe(2027)
    expect(context.date.getMonth()).toBe(0)
    expect(context.date.getDate()).toBe(1)
  })

  it('缺少路由参数时使用 fallbackDate', () => {
    const fallback = new Date(2026, 3, 18)
    const context = getRouteDateContext({}, fallback)

    expect(context.year).toBe(2026)
    expect(context.month).toBe(4)
    expect(context.day).toBe(18)
  })

  it('无效 day 会被归一化并标记为非 canonical', () => {
    const context = getRouteDateContext({
      year: '2026',
      month: '2',
      day: '31'
    })

    expect(context.date.getFullYear()).toBe(2026)
    expect(context.date.getMonth()).toBe(2)
    expect(context.date.getDate()).toBe(3)
    expect(context.isCanonical).toBe(false)
  })

  it('year 路由参数可解析但非 canonical 时保留解析值', () => {
    const context = getRouteYearContext('02026', 2025)

    expect(context.year).toBe(2026)
    expect(context.isCanonical).toBe(false)
  })

  it('0-99 的 year 路由参数不会被当成 canonical 年份', () => {
    const context = getRouteYearContext('1', 2025)

    expect(context.year).toBe(1)
    expect(context.isCanonical).toBe(false)
  })

  it('year 路由参数完全无效时回退到 fallbackYear', () => {
    const context = getRouteYearContext('abc', 2025)

    expect(context.year).toBe(2025)
    expect(context.isCanonical).toBe(false)
  })

  it('month 路由参数可解析但非 canonical 时保留解析值', () => {
    const context = getRouteMonthContext('02026', '04', new Date(2025, 0, 1))

    expect(context.year).toBe(2026)
    expect(context.month).toBe(4)
    expect(context.hasParsedYear).toBe(true)
    expect(context.isCanonical).toBe(false)
  })

  it('0-99 的 year 出现在 month 路由时不会被当成 canonical', () => {
    const context = getRouteMonthContext('1', '4', new Date(2025, 0, 1))

    expect(context.year).toBe(1)
    expect(context.month).toBe(4)
    expect(context.hasParsedYear).toBe(true)
    expect(context.isCanonical).toBe(false)
  })

  it('能正确生成日/月/年路由', () => {
    const date = new Date(2027, 0, 1)

    expect(buildDayPath(date)).toBe('/day/2027/1/1')
    expect(buildMonthPath(2027, 1)).toBe('/month/2027/1')
    expect(buildYearPath(2027)).toBe('/year/2027')
  })
})
