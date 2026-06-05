import { describe, it, expect } from 'vitest'
import {
  getMonthName,
  toDateOnly,
  isSameDay,
  getDaysInMonth,
  getFirstDayOffset
} from '../dateFormatter'

// ── getMonthName 测试 ──
describe('getMonthName', () => {
  // 默认格式为中文
  it('默认返回中文月份名', () => {
    expect(getMonthName(1)).toBe('一月')
    expect(getMonthName(6)).toBe('六月')
    expect(getMonthName(12)).toBe('十二月')
  })

  // 英文格式返回全大写英文月份
  it('英文格式返回大写英文月份', () => {
    expect(getMonthName(1, 'en')).toBe('JANUARY')
    expect(getMonthName(6, 'en')).toBe('JUNE')
    expect(getMonthName(12, 'en')).toBe('DECEMBER')
  })

  // full 格式返回中英双语
  it('full 格式返回中英双语月份', () => {
    expect(getMonthName(1, 'full')).toBe('一月 (January)')
    expect(getMonthName(12, 'full')).toBe('十二月 (December)')
  })

  // 字符串输入也能正确解析
  it('接受字符串形式的月份数字', () => {
    expect(getMonthName('3')).toBe('三月')
    expect(getMonthName('11', 'en')).toBe('NOVEMBER')
  })

  // 无效输入返回空字符串
  it('无效输入返回空字符串', () => {
    expect(getMonthName(0)).toBe('')
    expect(getMonthName(13)).toBe('')
    expect(getMonthName(-1)).toBe('')
    expect(getMonthName(NaN)).toBe('')
    expect(getMonthName('abc')).toBe('')
  })
})

// ── toDateOnly 测试 ──
describe('toDateOnly', () => {
  // 格式化为 YYYY-MM-DD
  it('将 Date 格式化为 YYYY-MM-DD', () => {
    expect(toDateOnly(new Date(2026, 5, 4))).toBe('2026-06-04')
  })

  // 月份和日期不足两位时补零
  it('月份和日期不足两位时补零', () => {
    expect(toDateOnly(new Date(2026, 0, 1))).toBe('2026-01-01')
    expect(toDateOnly(new Date(2026, 9, 9))).toBe('2026-10-09')
  })

  // 跨年日期
  it('跨年日期格式正确', () => {
    expect(toDateOnly(new Date(2025, 11, 31))).toBe('2025-12-31')
  })
})

// ── isSameDay 测试 ──
describe('isSameDay', () => {
  // 同一天不同时间返回 true
  it('同一天不同时间视为同一天', () => {
    const a = new Date(2026, 5, 4, 8, 0, 0)
    const b = new Date(2026, 5, 4, 23, 59, 59)
    expect(isSameDay(a, b)).toBe(true)
  })

  // 不同天返回 false
  it('不同天返回 false', () => {
    const a = new Date(2026, 5, 4)
    const b = new Date(2026, 5, 5)
    expect(isSameDay(a, b)).toBe(false)
  })

  // 同一天不同月份返回 false
  it('同日不同月返回 false', () => {
    const a = new Date(2026, 4, 4)
    const b = new Date(2026, 5, 4)
    expect(isSameDay(a, b)).toBe(false)
  })

  // 同月日不同年返回 false
  it('同月日不同年返回 false', () => {
    const a = new Date(2025, 5, 4)
    const b = new Date(2026, 5, 4)
    expect(isSameDay(a, b)).toBe(false)
  })
})

// ── getDaysInMonth 测试 ──
describe('getDaysInMonth', () => {
  // 常规月份天数
  it('常规月份返回正确天数', () => {
    expect(getDaysInMonth(2026, 1)).toBe(31)  // 一月
    expect(getDaysInMonth(2026, 4)).toBe(30)  // 四月
    expect(getDaysInMonth(2026, 2)).toBe(28)  // 二月（非闰年）
  })

  // 闰年二月有 29 天
  it('闰年二月返回 29 天', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29)  // 2024 是闰年
    expect(getDaysInMonth(2000, 2)).toBe(29)  // 2000 是闰年（能被 400 整除）
  })

  // 非闰年二月只有 28 天
  it('非闰年二月返回 28 天', () => {
    expect(getDaysInMonth(2023, 2)).toBe(28)
    expect(getDaysInMonth(1900, 2)).toBe(28)  // 1900 能被 100 整除但不能被 400 整除，非闰年
  })

  // 十二月固定 31 天
  it('十二月固定 31 天', () => {
    expect(getDaysInMonth(2026, 12)).toBe(31)
  })
})

// ── getFirstDayOffset 测试 ──
describe('getFirstDayOffset', () => {
  // 周一偏移量为 0
  it('周一返回偏移量 0', () => {
    // 2026-06-01 是周一
    expect(getFirstDayOffset(2026, 6)).toBe(0)
  })

  // 周二偏移量为 1
  it('周二返回偏移量 1', () => {
    // 2026-07-01 是周三？不对，需要验证
    // 2026-09-01 是周二
    expect(getFirstDayOffset(2026, 9)).toBe(1)
  })

  // 周日偏移量为 6
  it('周日返回偏移量 6', () => {
    // 2026-03-01 是周日
    expect(getFirstDayOffset(2026, 3)).toBe(6)
  })

  // 偏移量范围始终在 0-6 之间
  it('偏移量始终在 0-6 范围内', () => {
    for (let m = 1; m <= 12; m++) {
      const offset = getFirstDayOffset(2026, m)
      expect(offset).toBeGreaterThanOrEqual(0)
      expect(offset).toBeLessThanOrEqual(6)
    }
  })
})
