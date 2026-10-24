import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDateStore } from '@/stores/dateStore'

describe('dateStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态 currentDate 是 Date 类型', () => {
    const store = useDateStore()
    expect(store.currentDate).toBeInstanceOf(Date)
  })

  it('setDate(newDate) → currentDate 变为 newDate', () => {
    const store = useDateStore()
    const newDate = new Date(2025, 5, 15)
    store.setDate(newDate)

    expect(store.currentDate).toBe(newDate)
    expect(store.currentDate.getFullYear()).toBe(2025)
    expect(store.currentDate.getMonth()).toBe(5)
    expect(store.currentDate.getDate()).toBe(15)
  })

  it('setYearMonthDay 只传 year → month/day 不变', () => {
    const store = useDateStore()
    const original = new Date(2024, 2, 10)
    store.setDate(original)

    store.setYearMonthDay(2026)

    expect(store.currentDate.getFullYear()).toBe(2026)
    expect(store.currentDate.getMonth()).toBe(2)
    expect(store.currentDate.getDate()).toBe(10)
  })

  it('setYearMonthDay 只传 month（1-indexed）→ year/day 不变', () => {
    const store = useDateStore()
    const original = new Date(2024, 2, 10)
    store.setDate(original)

    // 传入 8 表示 8 月（1-indexed），内部转换为 JS 的 7（0-indexed）
    store.setYearMonthDay(undefined, 8)

    expect(store.currentDate.getFullYear()).toBe(2024)
    expect(store.currentDate.getMonth()).toBe(7)
    expect(store.currentDate.getDate()).toBe(10)
  })

  it('setYearMonthDay 只传 day → year/month 不变', () => {
    const store = useDateStore()
    const original = new Date(2024, 2, 10)
    store.setDate(original)

    store.setYearMonthDay(undefined, undefined, 25)

    expect(store.currentDate.getFullYear()).toBe(2024)
    expect(store.currentDate.getMonth()).toBe(2)
    expect(store.currentDate.getDate()).toBe(25)
  })

  it('setYearMonthDay 全传（1-indexed month）→ 全变', () => {
    const store = useDateStore()
    const original = new Date(2024, 2, 10)
    store.setDate(original)

    // 传入 12 表示 12 月（1-indexed），内部转换为 JS 的 11（0-indexed）
    store.setYearMonthDay(2026, 12, 31)

    expect(store.currentDate.getFullYear()).toBe(2026)
    expect(store.currentDate.getMonth()).toBe(11)
    expect(store.currentDate.getDate()).toBe(31)
  })

  it('setYearMonthDay 都不传 → 不变', () => {
    const store = useDateStore()
    const original = new Date(2024, 2, 10)
    store.setDate(original)

    store.setYearMonthDay()

    expect(store.currentDate.getFullYear()).toBe(2024)
    expect(store.currentDate.getMonth()).toBe(2)
    expect(store.currentDate.getDate()).toBe(10)
  })
})
