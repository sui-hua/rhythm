/**
 * ============================================
 * Year 视图逻辑层 (views/year/composables/useYearView.js)
 * ============================================
 *
 * 【模块职责】
 * - 年度总览视图的数据获取和状态管理
 * - 聚合所有习惯的年度打卡数据
 * - 计算每个月的打卡天数
 *
 * 【数据结构 - yearData】
 * - 12 个月的数据数组
 * - 每个月份包含：name（英文月份）、days（天数）、firstDayOffset（周一偏移）
 * - completedDays（本月已打卡的天数数组）
 *
 * 【路由参数】
 * - /year/:year
 * - 自动补全和合法性校验
 */
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
  const yearLogs = ref([])
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

  const fetchYearLogs = async (year) => {
    try {
      yearLogs.value = await db.habits.listLogsByYear(year)
    } catch (e) {
      console.error('Failed to fetch year logs', e)
      yearLogs.value = []
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

    await fetchYearLogs(context.year)

    return true
  }

  onMounted(syncYearRoute)
  watch(() => route.params.year, syncYearRoute)

  const yearData = computed(() => {
    const currentYear = routeYear.value
    const completedByMonth = new Map()

    yearLogs.value.forEach((log) => {
      const d = new Date(log.completed_at)
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth()
        const day = d.getDate()
        if (!completedByMonth.has(m)) completedByMonth.set(m, new Set())
        completedByMonth.get(m).add(day)
      }
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
