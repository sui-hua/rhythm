/**
 * Habit 重复规则工具
 *
 * 统一处理 habit.frequency 的默认值、标准化和日期命中判断。
 * 当前支持：
 * - 每日：{ type: 'daily' }
 * - 每周：{ type: 'weekly', weekdays: [1, 3, 5] }
 * - 每月：{ type: 'monthly', monthDays: [1, 15, 28] }
 */

// 每日重复规则
export interface DailyFrequency {
  type: 'daily'
}

// 每周重复规则，weekdays 为 1-7 的数组（周一=1，周日=7）
export interface WeeklyFrequency {
  type: 'weekly'
  weekdays: number[]
}

// 每月重复规则，monthDays 为 1-31 的数组
export interface MonthlyFrequency {
  type: 'monthly'
  monthDays: number[]
}

// 所有重复规则的联合类型
export type HabitFrequency = DailyFrequency | WeeklyFrequency | MonthlyFrequency

/**
 * 创建默认重复规则
 * @returns 每日重复规则
 */
export const createDefaultHabitFrequency = (): DailyFrequency => ({ type: 'daily' })

/**
 * 将数值数组标准化为指定范围内的去重排序整数数组
 * @param values - 原始数值数组
 * @param options - 最小值和最大值约束
 * @returns 标准化后的整数数组
 */
const normalizeNumberArray = (values: unknown, { min, max }: { min: number; max: number }): number[] => {
    if (!Array.isArray(values)) return []

    return Array.from(
        new Set(
            values
                .map((value) => Number.parseInt(value as string, 10))
                .filter((value) => Number.isInteger(value) && value >= min && value <= max)
        )
    ).sort((a, b) => a - b)
}

/**
 * 标准化 frequency 结构
 * 非法结构统一回退为每日
 *
 * @param frequency - 原始 frequency 数据
 * @returns 标准化后的重复规则
 */
export const normalizeHabitFrequency = (frequency: unknown): HabitFrequency => {
    if (!frequency || typeof frequency !== 'object') {
        return createDefaultHabitFrequency()
    }

    const freq = frequency as Record<string, unknown>

    if (freq.type === 'weekly') {
        const weekdays = normalizeNumberArray(freq.weekdays, { min: 1, max: 7 })
        return weekdays.length > 0
            ? { type: 'weekly', weekdays }
            : createDefaultHabitFrequency()
    }

    if (freq.type === 'monthly') {
        const monthDays = normalizeNumberArray(freq.monthDays, { min: 1, max: 31 })
        return monthDays.length > 0
            ? { type: 'monthly', monthDays }
            : createDefaultHabitFrequency()
    }

    return createDefaultHabitFrequency()
}

/**
 * 将 JavaScript 的星期值转换为周一=1、周日=7
 *
 * @param date - 日期对象
 * @returns 星期数值（1-7）
 */
export const getWeekdayNumber = (date: Date): number => {
    const weekday = date.getDay()
    return weekday === 0 ? 7 : weekday
}

/**
 * 判断某个日期是否命中 habit 频率规则
 *
 * @param frequency - 重复规则数据
 * @param date - 要判断的日期
 * @returns 是否命中规则
 */
export const matchesHabitFrequency = (frequency: unknown, date: Date): boolean => {
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
