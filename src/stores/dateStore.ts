import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDateStore = defineStore('date', () => {
  // 当前选中日期
  const currentDate = ref<Date>(new Date())

  // 设置日期
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
    // 注意：JavaScript 中的 month 是 0-indexed 的，传入的值应当注意兼容
    const newDate = new Date(currentDate.value)
    if (year !== undefined) newDate.setFullYear(year)
    if (month !== undefined) newDate.setMonth(month)
    if (day !== undefined) newDate.setDate(day)

    currentDate.value = newDate
  }

  return {
    currentDate,
    setDate,
    setYearMonthDay
  }
})
