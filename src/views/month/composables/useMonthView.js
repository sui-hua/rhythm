import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import {
  buildDayPath,
  buildMonthPath,
  buildYearPath,
  getRouteMonthContext
} from '@/views/day/utils/routeDateContext'

export const useMonthView = () => {
  const dateStore = useDateStore()
  const router = useRouter()
  const route = useRoute()

  const isPageLoading = ref(false)
  const tasks = ref([])

  const routeDateContext = computed(() => getRouteMonthContext(
    route.params.year,
    route.params.month,
    dateStore.currentDate
  ))
  const routeYear = computed(() => routeDateContext.value.year)
  const routeMonth = computed(() => routeDateContext.value.month)

  const selectedMonth = computed(() => {
    const currentYear = routeYear.value
    const monthNum = routeMonth.value
    const monthZeroBased = monthNum - 1
    const daysInMonth = new Date(currentYear, monthZeroBased + 1, 0).getDate()

    return {
      name: getMonthName(monthNum, 'en'),
      days: daysInMonth,
      firstDayOffset: (new Date(currentYear, monthZeroBased, 1).getDay() + 6) % 7,
      index: monthZeroBased
    }
  })

  const syncDateWithRoute = () => {
    dateStore.setYearMonthDay(routeYear.value, routeMonth.value - 1, 1)
  }

  const validateMonthRoute = () => {
    const context = routeDateContext.value

    if (context.month < 1 || context.month > 12) {
      const targetYear = context.hasParsedYear
        ? new Date(context.year, 0, 1).getFullYear()
        : dateStore.currentDate.getFullYear()
      router.replace(buildYearPath(targetYear))
      return false
    }

    if (!context.isCanonical) {
      const targetDate = new Date(context.year, context.month - 1, 1)
      router.replace(buildMonthPath(targetDate.getFullYear(), targetDate.getMonth() + 1))
      return false
    }

    return true
  }

  const fetchMonthTasks = async () => {
    isPageLoading.value = true
    const monthZeroBased = routeMonth.value - 1
    const currentYear = routeYear.value
    const start = new Date(currentYear, monthZeroBased, 1)
    const end = new Date(currentYear, monthZeroBased + 1, 0, 23, 59, 59)

    try {
      tasks.value = await db.tasks.list(start, end)
    } catch (e) {
      console.error(e)
    } finally {
      isPageLoading.value = false
    }
  }

  const handleRouteSync = async () => {
    if (!validateMonthRoute()) return false
    syncDateWithRoute()
    await fetchMonthTasks()
    return true
  }

  onMounted(handleRouteSync)
  watch(() => [route.params.year, route.params.month], handleRouteSync)

  const monthGridData = computed(() => {
    const currentYear = routeYear.value
    const grid = []
    const { index, days, firstDayOffset } = selectedMonth.value
    const prevMonthLastDay = new Date(currentYear, index, 0).getDate()

    for (let i = firstDayOffset - 1; i >= 0; i--) {
      grid.push({ date: prevMonthLastDay - i, isCurrent: false })
    }

    for (let i = 1; i <= days; i++) {
      const dayTasks = tasks.value.filter((t) => {
        const d = new Date(t.start_time)
        return d.getDate() === i && d.getMonth() === index && d.getFullYear() === currentYear
      })

      const taskHours = dayTasks.flatMap((task) => {
        const dStart = new Date(task.start_time)
        const dEnd = new Date(task.end_time)
        const start = dStart.getHours() + dStart.getMinutes() / 60
        const end = dEnd.getHours() + dEnd.getMinutes() / 60

        const hours = []
        for (let h = Math.floor(start); h < Math.ceil(end); h++) {
          hours.push(h)
        }
        return hours
      })

      grid.push({
        date: i,
        isCurrent: true,
        tasks: dayTasks.map((t) => t.id),
        taskHours
      })
    }

    while (grid.length < 42) {
      grid.push({ date: grid.length - days - firstDayOffset + 1, isCurrent: false })
    }

    return grid
  })

  const goBackToYear = () => {
    router.push(buildYearPath(routeYear.value))
  }

  const enterDay = (date) => {
    router.push(buildDayPath(new Date(routeYear.value, selectedMonth.value.index, date)))
  }

  return {
    selectedMonth,
    monthGridData,
    goBackToYear,
    enterDay,
    isPageLoading
  }
}
