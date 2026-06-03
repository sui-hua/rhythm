import { computed } from 'vue'
import {
  createDefaultHabitFrequency,
  normalizeHabitFrequency
} from '@/views/habits/utils/habitFrequency'

export const WEEKDAY_OPTIONS = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 7 }
]

export const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1)

export function useHabitFrequencyForm(form) {
  const canSubmitFrequency = computed(() => {
    if (form.frequencyType === 'weekly') return form.weekdays.length > 0
    if (form.frequencyType === 'monthly') return form.monthDays.length > 0
    return true
  })

  const toggleWeekday = (weekday) => {
    form.weekdays = form.weekdays.includes(weekday)
      ? form.weekdays.filter((item) => item !== weekday)
      : [...form.weekdays, weekday].sort((a, b) => a - b)
  }

  const toggleMonthDay = (day) => {
    form.monthDays = form.monthDays.includes(day)
      ? form.monthDays.filter((item) => item !== day)
      : [...form.monthDays, day].sort((a, b) => a - b)
  }

  const buildFrequencyPayload = () => {
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
