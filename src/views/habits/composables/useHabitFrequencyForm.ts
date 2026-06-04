import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import {
  createDefaultHabitFrequency,
  normalizeHabitFrequency
} from '@/views/habits/utils/habitFrequency'
import type { HabitFrequency } from '@/views/habits/utils/habitFrequency'

// 星期选项
export interface WeekdayOption {
  label: string
  value: number
}

// 频率表单数据结构（由外部传入的 reactive 对象）
export interface FrequencyForm {
  frequencyType: 'daily' | 'weekly' | 'monthly'
  weekdays: number[]
  monthDays: number[]
}

// useHabitFrequencyForm composable 的返回值接口
export interface UseHabitFrequencyFormReturn {
  WEEKDAY_OPTIONS: WeekdayOption[]
  MONTH_DAY_OPTIONS: number[]
  canSubmitFrequency: ComputedRef<boolean>
  toggleWeekday: (weekday: number) => void
  toggleMonthDay: (day: number) => void
  buildFrequencyPayload: () => HabitFrequency
}

// 星期选项常量
export const WEEKDAY_OPTIONS: WeekdayOption[] = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 7 }
]

// 月日选项常量（1-31）
export const MONTH_DAY_OPTIONS: number[] = Array.from({ length: 31 }, (_, index) => index + 1)

/**
 * 习惯频率表单逻辑 composable
 *
 * 处理频率类型的切换、星期/月日的勾选，
 * 以及构建提交用的频率载荷。
 *
 * @param form - 外部传入的频率表单 reactive 对象
 * @returns 频率表单相关的状态和操作方法
 */
export function useHabitFrequencyForm(form: FrequencyForm): UseHabitFrequencyFormReturn {
  // 校验当前频率配置是否可提交
  const canSubmitFrequency: ComputedRef<boolean> = computed(() => {
    if (form.frequencyType === 'weekly') return form.weekdays.length > 0
    if (form.frequencyType === 'monthly') return form.monthDays.length > 0
    return true
  })

  // 切换星期的选中状态（排序保持升序）
  const toggleWeekday = (weekday: number): void => {
    form.weekdays = form.weekdays.includes(weekday)
      ? form.weekdays.filter((item) => item !== weekday)
      : [...form.weekdays, weekday].sort((a, b) => a - b)
  }

  // 切换月日的选中状态（排序保持升序）
  const toggleMonthDay = (day: number): void => {
    form.monthDays = form.monthDays.includes(day)
      ? form.monthDays.filter((item) => item !== day)
      : [...form.monthDays, day].sort((a, b) => a - b)
  }

  // 根据当前表单状态构建标准化的频率载荷
  const buildFrequencyPayload = (): HabitFrequency => {
    if (form.frequencyType === 'weekly') {
      return normalizeHabitFrequency({
        type: 'weekly',
        weekdays: form.weekdays
      })
    }
    if (form.frequencyType === 'monthly') {
      return normalizeHabitFrequency({
        type: 'monthly',
        monthDays: form.monthDays
      })
    }
    return createDefaultHabitFrequency()
  }

  return {
    WEEKDAY_OPTIONS,
    MONTH_DAY_OPTIONS,
    canSubmitFrequency,
    toggleWeekday,
    toggleMonthDay,
    buildFrequencyPayload
  }
}
