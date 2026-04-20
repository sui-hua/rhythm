/**
 * ============================================
 * 日期状态管理 (stores/dateStore.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理全局日期上下文
 * - 用于视图间共享当前选中日期
 * - 支撑日期导航（年/月/日视图间的日期同步）
 *
 * 【数据结构】
 * - currentDate: Date    → 当前日期（响应式）
 *
 * 【设计说明】
 * - 默认值为系统当天日期（new Date()），确保刷新后与真实日期同步
 * - 提供两种设值方式：直接替换整个 Date 对象，或按年月日组件修改
 * - 月份在 JavaScript Date 中为 0-indexed（0=一月，11=十二月），调用方需注意
 *
 * @module stores/dateStore
 * @see {@link https://pinia.vuejs.org/} Pinia 状态管理
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDateStore = defineStore('date', () => {
    // 默认为系统当天的真实日期
    const currentDate = ref(new Date())

    /**
     * 设置当前日期为新的 Date 对象
     * @param {Date} newDate - 新的日期对象
     * @returns {void}
     * @example
     * setDate(new Date('2026-04-20'))
     */
    const setDate = (newDate) => {
        currentDate.value = newDate
    }

    /**
     * 按年月日分量设置日期（仅修改传入的字段，未传参的字段保持不变）
     * 适用于只想改年、或只想改月、或只想改日的场景
     *
     * @param {number} [year] - 年份（如 2026）
     * @param {number} [month] - 月份（0-11，JavaScript 标准 0-indexed）
     * @param {number} [day] - 日期（1-31）
     * @returns {void}
     *
     * @example
     * // 只改年份为 2025
     * setYearMonthDay(2025)
     *
     * @example
     * // 同时改成年 2026 年 5 月（month=4 因为 0-indexed）
     * setYearMonthDay(2026, 4, 15)
     */
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
