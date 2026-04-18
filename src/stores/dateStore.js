/**
 * ============================================
 * 日期状态管理 (stores/dateStore.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理全局日期上下文
 * - 用于视图间共享当前选中日期
 *
 * 【数据结构】
 * - currentDate: Date    → 当前日期
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDateStore = defineStore('date', () => {
    // 默认为系统当天的真实日期
    const currentDate = ref(new Date())

    const setDate = (newDate) => {
        currentDate.value = newDate
    }

    // 设置为指定年月日（如果只需要改其中某项，可以用这种便捷方法）
    const setYearMonthDay = (year, month, day) => {
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
