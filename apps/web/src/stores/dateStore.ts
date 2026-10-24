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
   * month 参数统一为 1-indexed（与路由参数、数据库、UI 一致）
   * @param year - 年份
   * @param month - 月份（1-12，1-indexed）
   * @param day - 日
   *
   * @example setYearMonthDay(2026, 5, 15) → 2026 年 5 月 15 日
   */
  const setYearMonthDay = (year?: number, month?: number, day?: number): void => {
    // 基于当前日期副本修改，避免直接 mutate 原始 Date 对象导致引用丢失
    const newDate = new Date(currentDate.value)
    if (year !== undefined) newDate.setFullYear(year)
    // 内部转换：month 从 1-indexed 转为 JavaScript 的 0-indexed
    if (month !== undefined) newDate.setMonth(month - 1)
    if (day !== undefined) newDate.setDate(day)

    currentDate.value = newDate
  }

  return {
    currentDate,
    setDate,
    setYearMonthDay
  }
})
