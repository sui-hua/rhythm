import { describe, expect, it } from 'vitest'
import {
  createDefaultHabitFrequency,
  getWeekdayNumber,
  matchesHabitFrequency,
  normalizeHabitFrequency
} from '@/views/habits/utils/habitFrequency'

describe('habitFrequency', () => {
  it('未指定重复规则时默认按每日处理', () => {
    expect(createDefaultHabitFrequency()).toEqual({ type: 'daily' })
  })

  it('会把 JavaScript 的周日映射为 7', () => {
    expect(getWeekdayNumber(new Date('2026-04-19T12:00:00.000Z'))).toBe(7)
  })

  it('保留合法的每周重复规则', () => {
    expect(normalizeHabitFrequency({
      type: 'weekly',
      weekdays: [1, 3, 5]
    })).toEqual({
      type: 'weekly',
      weekdays: [1, 3, 5]
    })
  })

  it('每周重复规则在过滤后为空时回退到每日', () => {
    expect(normalizeHabitFrequency({
      type: 'weekly',
      weekdays: [0, 9, 'x']
    })).toEqual({ type: 'daily' })
  })

  it('每周重复规则只在命中的星期显示', () => {
    const frequency = { type: 'weekly', weekdays: [1, 3, 5] }

    expect(matchesHabitFrequency(frequency, new Date(2026, 3, 20))).toBe(true)
    expect(matchesHabitFrequency(frequency, new Date(2026, 3, 21))).toBe(false)
  })

  it('每月重复规则只在命中的号数显示', () => {
    const frequency = { type: 'monthly', monthDays: [1, 15, 28] }

    expect(matchesHabitFrequency(frequency, new Date(2026, 3, 15))).toBe(true)
    expect(matchesHabitFrequency(frequency, new Date(2026, 3, 16))).toBe(false)
  })

  it('缺少重复规则时按每日命中', () => {
    expect(matchesHabitFrequency(null, new Date(2026, 3, 18))).toBe(true)
  })
})
