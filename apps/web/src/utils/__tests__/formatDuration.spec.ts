import { describe, it, expect } from 'vitest'
import { formatDuration, formatMinutes } from '../formatDuration'

// ── formatDuration 测试 ──
describe('formatDuration', () => {
  // null、undefined、0、负数统一返回 "0分钟"
  it('null 返回 "0分钟"', () => {
    expect(formatDuration(null)).toBe('0分钟')
  })

  it('undefined 返回 "0分钟"', () => {
    expect(formatDuration(undefined)).toBe('0分钟')
  })

  it('0 返回 "0分钟"', () => {
    expect(formatDuration(0)).toBe('0分钟')
  })

  it('负数返回 "0分钟"', () => {
    expect(formatDuration(-1)).toBe('0分钟')
    expect(formatDuration(-0.5)).toBe('0分钟')
  })

  // 不足 1 小时只显示分钟
  it('0.5 小时返回 "30分钟"', () => {
    expect(formatDuration(0.5)).toBe('30分钟')
  })

  it('不足 1 小时时只显示分钟', () => {
    expect(formatDuration(0.25)).toBe('15分钟')
    expect(formatDuration(0.75)).toBe('45分钟')
    expect(formatDuration(0.01)).toBe('1分钟')  // 0.01*60=0.6 四舍五入为 1
  })

  // 整数小时只显示小时
  it('1 小时返回 "1小时"', () => {
    expect(formatDuration(1)).toBe('1小时')
  })

  it('整数小时只显示小时部分', () => {
    expect(formatDuration(2)).toBe('2小时')
    expect(formatDuration(8)).toBe('8小时')
  })

  // 非整数小时同时显示小时和分钟
  it('1.5 小时返回 "1小时30分钟"', () => {
    expect(formatDuration(1.5)).toBe('1小时30分钟')
  })

  it('2.25 小时返回 "2小时15分钟"', () => {
    expect(formatDuration(2.25)).toBe('2小时15分钟')
  })

  // 边界：浮点精度问题处理
  it('浮点精度边界不出现 "60分钟"', () => {
    // 1/60 ≈ 0.01666... * 60 应四舍五入为 1 分钟而非 60 分钟
    expect(formatDuration(1 + 1 / 60)).toBe('1小时1分钟')
  })
})

// ── formatMinutes 测试 ──
describe('formatMinutes', () => {
  // 委托给 formatDuration，分钟数除以 60 转为小时
  it('30 分钟返回 "30分钟"', () => {
    expect(formatMinutes(30)).toBe('30分钟')
  })

  it('60 分钟返回 "1小时"', () => {
    expect(formatMinutes(60)).toBe('1小时')
  })

  it('90 分钟返回 "1小时30分钟"', () => {
    expect(formatMinutes(90)).toBe('1小时30分钟')
  })

  it('0 分钟返回 "0分钟"', () => {
    expect(formatMinutes(0)).toBe('0分钟')
  })
})
