import { computed, onMounted, ref, watch } from 'vue'
/**
 * useMonthView - 月度视图逻辑
 * 管理月度任务数据获取、月历网格生成和导航
 */
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'

export const useMonthView = () => {
  const dateStore = useDateStore()
  const router = useRouter()
  const route = useRoute()

  const isPageLoading = ref(false)
  const tasks = ref([])

  const monthIndexFromRoute = computed(() => parseInt(route.params.monthIndex))

  const selectedMonth = computed(() => {
    const currentYear = dateStore.currentDate.getFullYear()
    const monthNum = monthIndexFromRoute.value
    const monthIndex = monthNum - 1
    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate()

    return {
      name: getMonthName(monthNum, 'en'),
      days: daysInMonth,
      firstDayOffset: (new Date(currentYear, monthIndex, 1).getDay() + 6) % 7,
      index: monthIndex
    }
  })

  const ensureValidMonth = () => {
    const monthIndex = monthIndexFromRoute.value
    if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12) {
      router.push('/year')
      return false
    }
    return true
  }

  const fetchMonthTasks = async () => {
    if (!ensureValidMonth()) return

    isPageLoading.value = true
    const monthIndex = monthIndexFromRoute.value - 1
    const currentYear = dateStore.currentDate.getFullYear()
    const start = new Date(currentYear, monthIndex, 1)
    const end = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59)

    try {
      tasks.value = await db.tasks.list(start, end)
    } catch (e) {
      console.error(e)
    } finally {
      isPageLoading.value = false
    }
  }

  onMounted(fetchMonthTasks)
  watch(() => route.params.monthIndex, fetchMonthTasks)

  const monthGridData = computed(() => {
    const currentYear = dateStore.currentDate.getFullYear()
    const grid = []
    const { index, days, firstDayOffset } = selectedMonth.value
    const prevMonthLastDay = new Date(currentYear, index, 0).getDate()

    // Fill previous month days
    for (let i = firstDayOffset - 1; i >= 0; i--) {
      grid.push({ date: prevMonthLastDay - i, isCurrent: false })
    }

    // Fill current month days
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

    // Fill to 42 cells
    while (grid.length < 42) {
      grid.push({ date: grid.length - days - firstDayOffset + 1, isCurrent: false })
    }

    return grid
  })

  const goBackToYear = () => {
    router.push('/year')
  }

  const enterDay = (date) => {
    router.push(`/day/${selectedMonth.value.index + 1}/${date}`)
  }

  return {
    selectedMonth,
    monthGridData,
    goBackToYear,
    enterDay,
    isPageLoading
  }
}
