// useYearView.ts
// Year 模块的视图逻辑层，负责年度习惯打卡数据的聚合和路由同步

import type { Ref, ComputedRef } from 'vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Habit, HabitLog } from '@/services/db/habit'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { buildMonthPath, buildYearPath, getRouteYearContext } from '@/views/day/utils/routeDateContext'

// 月份数据项，包含日历渲染所需的全部信息和打卡统计
export interface YearMonthData {
  /** 英文月份名 */
  name: string
  /** 该月天数 */
  days: number
  /** 周一偏移（0=周一），用于日历网格对齐 */
  firstDayOffset: number
  /** 月份索引 0-11 */
  index: number
  /** 该月已打卡日期数组，用于热力图渲染 */
  completedDays: number[]
}

// useYearView composable 的返回值类型
export interface UseYearViewReturn {
  /** 12个月的打卡统计数据，用于渲染年度热力图 */
  yearData: ComputedRef<YearMonthData[]>
  /** 导航到月度视图 */
  enterMonth: (month: YearMonthData) => void
  /** 页面加载状态 */
  isPageLoading: Ref<boolean>
}

/**
 * 年度总览视图逻辑
 *
 * 使用场景：Year 页面，展示年度习惯打卡热力图
 * 数据流：路由参数 → fetchHabits + fetchYearLogs → yearData 聚合计算 → 组件渲染
 */
export const useYearView = (): UseYearViewReturn => {
  // 页面级加载状态
  const isPageLoading = ref(false)

  // 当前年度所有未归档的习惯列表，仅首次进入时加载
  const habits = ref<Habit[]>([])

  // 当前年度所有习惯的打卡日志，每年切换时重新加载
  const yearLogs = ref<HabitLog[]>([])

  const route = useRoute()
  const router = useRouter()
  const dateStore = useDateStore()

  // 从路由参数解析并规范化年份，支持自动补全和合法性校验
  const routeYear = computed((): number =>
    getRouteYearContext(route.params.year as string, dateStore.currentDate.getFullYear()).year
  )

  // 标记习惯数据是否已获取，避免路由切换时重复请求
  const hasFetchedHabits = ref(false)

  // 获取所有未归档的习惯列表
  const fetchHabits = async (): Promise<void> => {
    isPageLoading.value = true
    try {
      const allHabits = await db.habit.list()
      // 过滤掉已归档的习惯，只保留活跃习惯用于年度统计
      habits.value = allHabits.filter((habit) => !(habit as Habit & { is_archived?: boolean }).is_archived)
    } catch (e) {
      console.error('Failed to fetch habits', e)
    } finally {
      isPageLoading.value = false
    }
  }

  // 获取指定年份的所有打卡日志，用于聚合统计
  const fetchYearLogs = async (year: number): Promise<void> => {
    try {
      yearLogs.value = await db.habit.listLogsByYear(year)
    } catch (e) {
      console.error('Failed to fetch year logs', e)
      yearLogs.value = []
    }
  }

  /**
   * 路由同步主函数
   *
   * 校验路由年份合法性 → 更新全局日期状态 → 按需加载数据。
   * 返回 false 表示路由不合法已重定向，调用方应终止后续逻辑。
   */
  const syncYearRoute = async (): Promise<boolean> => {
    const context = getRouteYearContext(route.params.year as string, dateStore.currentDate.getFullYear())

    // 非规范路由（如缺少年份、格式错误）重定向到规范路径
    if (!context.isCanonical) {
      const targetYear = context.hasParsedYear
        ? new Date(context.year, 0, 1).getFullYear()
        : dateStore.currentDate.getFullYear()
      router.replace(buildYearPath(targetYear))
      return false
    }

    // 更新全局日期状态为该年1月1日
    dateStore.setYearMonthDay(context.year, 0, 1)

    // 习惯列表仅首次加载一次，年度日志每年切换时重新加载
    if (!hasFetchedHabits.value) {
      await fetchHabits()
      hasFetchedHabits.value = true
    }

    await fetchYearLogs(context.year)

    return true
  }

  // 页面挂载时执行初始同步
  onMounted(syncYearRoute)
  // 路由参数 year 变化时重新同步（如点击不同年份）
  watch(() => route.params.year, syncYearRoute)

  /**
   * 年度数据聚合计算
   *
   * 将打卡日志按月份分组统计，构建 12 个月的数据数组供热力图渲染。
   * 使用 Set 去重同一天的多次打卡，确保 completedDays 无重复。
   */
  const yearData = computed((): YearMonthData[] => {
    const currentYear = routeYear.value
    // 按月索引存储已打卡日期集合，自动去重
    const completedByMonth = new Map<number, Set<number>>()

    yearLogs.value.forEach((log) => {
      const d = new Date(log.completed_at ?? '')
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth()
        const day = d.getDate()
        if (!completedByMonth.has(m)) completedByMonth.set(m, new Set())
        completedByMonth.get(m)!.add(day)
      }
    })

    // 构建 12 个月的数据数组
    const result: YearMonthData[] = []
    for (let m = 1; m <= 12; m++) {
      const index = m - 1
      const name = getMonthName(m, 'en')
      const daysInMonth = new Date(currentYear, m, 0).getDate()
      result.push({
        name,
        days: daysInMonth,
        // (getDay() + 6) % 7 将周日(0)映射为6，周一(1)映射为0，符合 ISO 8601
        firstDayOffset: (new Date(currentYear, index, 1).getDay() + 6) % 7,
        index,
        completedDays: completedByMonth.has(index)
          ? Array.from(completedByMonth.get(index)!)
          : []
      })
    }

    return result
  })

  // 点击月度区块时导航到 /month/:year/:month 路由
  const enterMonth = (month: YearMonthData): void => {
    // index 是 0-11，路由参数需要 1-12，所以 +1
    router.push(buildMonthPath(routeYear.value, month.index + 1))
  }

  return {
    yearData,
    enterMonth,
    isPageLoading
  }
}
