/**
 * useYearView - 年度视图逻辑
 * 从习惯数据统计年度完成情况，生成12个月的完成天数数据
 */
import { useRouter } from 'vue-router'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'

export const useYearView = () => {
  const dateStore = useDateStore()
  const router = useRouter()

  const habits = ref([])

  onMounted(async () => {
    try {
      const allHabits = await db.habits.list()
      habits.value = allHabits.filter((habit) => !habit.is_archived)
    } catch (e) {
      console.error(e)
    }
  })

  const yearData = computed(() => {
    const currentYear = dateStore.currentDate.getFullYear()
    const completedByMonth = new Map()

    habits.value.forEach((habit) => {
      const logs = habit.habit_logs || []
      logs.forEach((log) => {
        const d = new Date(log.completed_at)
        if (d.getFullYear() === currentYear) {
          const m = d.getMonth()
          const day = d.getDate()
          if (!completedByMonth.has(m)) completedByMonth.set(m, new Set())
          completedByMonth.get(m).add(day)
        }
      })
    })

    const result = []
    for (let m = 1; m <= 12; m++) {
      const index = m - 1
      const name = getMonthName(m, 'en')
      const daysInMonth = new Date(currentYear, m, 0).getDate()
      result.push({
        name,
        days: daysInMonth,
        firstDayOffset: (new Date(currentYear, index, 1).getDay() + 6) % 7,
        index,
        completedDays: completedByMonth.has(index) ? Array.from(completedByMonth.get(index)) : []
      })
    }

    return result
  })

  const enterMonth = (month) => {
    router.push(`/month/${month.index + 1}`)
  }

  return {
    yearData,
    enterMonth
  }
}
