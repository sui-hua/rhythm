// dateStore.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 全局日期状态管理
 * 存储当前选中日期，供 Timeline、Month、Year 等模块统一读取
 */
export const useDateStore = defineStore('date', () => {
  // ── 状态 ──
  // 当前选中日期，初始化为当天
  const currentDate = ref<Date>(new Date())

  // ── Actions ──
  // 整体替换日期对象
  const setDate = (newDate: Date): void => {
    currentDate.value = newDate
  }

  /**
   * 按年月日分量设置日期，仅修改传入的字段，未传参的字段保持不变
   * @param year - 年份
   * @param month - 月份（0-11，JavaScript 标准 0-indexed）
   * @param day - 日
   *
   * @example setYearMonthDay(2026, 4, 15) → month=4 表示 5 月
   */
  const setYearMonthDay = (year?: number, month?: number, day?: number): void => {
    // 基于当前日期副本修改，避免直接 mutate 原始 Date 对象导致引用丢失
    const newDate = new Date(currentDate.value)
    if (year !== undefined) newDate.setFullYear(year)
    if (month !== undefined) newDate.setMonth(month)
    // JavaScript Date 的 month 是 0-indexed，调用方需注意传入 0-11
    if (day !== undefined) newDate.setDate(day)

    currentDate.value = newDate
  }

  return {
    currentDate,
    setDate,
    setYearMonthDay
  }
})
