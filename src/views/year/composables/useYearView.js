import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { buildMonthPath, buildYearPath, getRouteYearContext } from '@/views/day/utils/routeDateContext'

export const useYearView = () => {
  const dateStore = useDateStore()
  const router = useRouter()
  const route = useRoute()

  const isPageLoading = ref(false)
  const habits = ref([])
  const routeYear = computed(() => getRouteYearContext(route.params.year, dateStore.currentDate.getFullYear()).year)
  const hasFetchedHabits = ref(false)

  const fetchHabits = async () => {
    isPageLoading.value = true
    try {
      const allHabits = await db.habits.list()
      habits.value = allHabits.filter((habit) => !habit.is_archived)
    } catch (e) {
      console.error(e)
    } finally {
      isPageLoading.value = false
    }
  }

  const syncYearRoute = async () => {
    const context = getRouteYearContext(route.params.year, dateStore.currentDate.getFullYear())

    if (!context.isCanonical) {
      const targetYear = context.hasParsedYear
        ? new Date(context.year, 0, 1).getFullYear()
        : dateStore.currentDate.getFullYear()
      router.replace(buildYearPath(targetYear))
      return false
    }

    dateStore.setYearMonthDay(context.year, 0, 1)

    if (!hasFetchedHabits.value) {
      await fetchHabits()
      hasFetchedHabits.value = true
    }

    return true
  }

  onMounted(syncYearRoute)
  watch(() => route.params.year, syncYearRoute)

  const yearData = computed(() => {
    const currentYear = routeYear.value
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
    router.push(buildMonthPath(routeYear.value, month.index + 1))
  }

  return {
    yearData,
    enterMonth,
    isPageLoading
  }
}
