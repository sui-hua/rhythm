/**
 * Habit 重复规则工具
 *
 * 统一处理 habit.frequency 的默认值、标准化和日期命中判断。
 * 当前支持：
 * - 每日：{ type: 'daily' }
 * - 每周：{ type: 'weekly', weekdays: [1, 3, 5] }
 * - 每月：{ type: 'monthly', monthDays: [1, 15, 28] }
 */

/**
 * 创建默认重复规则
 * @returns {{ type: 'daily' }}
 */
export const createDefaultHabitFrequency = () => ({ type: 'daily' })

const normalizeNumberArray = (values, { min, max }) => {
    if (!Array.isArray(values)) return []

    return Array.from(
        new Set(
            values
                .map((value) => Number.parseInt(value, 10))
                .filter((value) => Number.isInteger(value) && value >= min && value <= max)
        )
    ).sort((a, b) => a - b)
}

/**
 * 标准化 frequency 结构
 * 非法结构统一回退为每日
 *
 * @param {unknown} frequency
 * @returns {{ type: 'daily' } | { type: 'weekly', weekdays: number[] } | { type: 'monthly', monthDays: number[] }}
 */
export const normalizeHabitFrequency = (frequency) => {
    if (!frequency || typeof frequency !== 'object') {
        return createDefaultHabitFrequency()
    }

    if (frequency.type === 'weekly') {
        const weekdays = normalizeNumberArray(frequency.weekdays, { min: 1, max: 7 })
        return weekdays.length > 0
            ? { type: 'weekly', weekdays }
            : createDefaultHabitFrequency()
    }

    if (frequency.type === 'monthly') {
        const monthDays = normalizeNumberArray(frequency.monthDays, { min: 1, max: 31 })
        return monthDays.length > 0
            ? { type: 'monthly', monthDays }
            : createDefaultHabitFrequency()
    }

    return createDefaultHabitFrequency()
}

/**
 * 将 JavaScript 的星期值转换为周一=1、周日=7
 *
 * @param {Date} date
 * @returns {number}
 */
export const getWeekdayNumber = (date) => {
    const weekday = date.getDay()
    return weekday === 0 ? 7 : weekday
}

/**
 * 判断某个日期是否命中 habit 频率规则
 *
 * @param {unknown} frequency
 * @param {Date} date
 * @returns {boolean}
 */
export const matchesHabitFrequency = (frequency, date) => {
    const normalized = normalizeHabitFrequency(frequency)

    if (normalized.type === 'daily') return true

    if (normalized.type === 'weekly') {
        return normalized.weekdays.includes(getWeekdayNumber(date))
    }

    if (normalized.type === 'monthly') {
        return normalized.monthDays.includes(date.getDate())
    }

    return true
}
