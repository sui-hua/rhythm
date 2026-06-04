// useMonthView.ts
// Month 模块的视图逻辑层，负责月度日历数据获取、网格计算和路由同步

import type { Ref, ComputedRef } from 'vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Task } from '@/services/db/task'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName, getDaysInMonth, getFirstDayOffset } from '@/utils/dateFormatter'
import {
  buildDayPath,
  buildMonthPath,
  buildYearPath,
  getRouteMonthContext
} from '@/views/day/utils/routeDateContext'

// 选中月份的详情信息，用于日历头部展示和网格计算
export interface SelectedMonthInfo {
  /** 月份英文名称 */
  name: string
  /** 该月总天数 */
  days: number
  /** 首日距离周一的天数偏移（0=周一, 1=周二, ..., 6=周日） */
  firstDayOffset: number
  /** 月份索引（0-11，0=一月） */
  index: number
}

// 日历网格单元格，42 格中的每一格
export interface MonthGridCell {
  /** 日期（1-31） */
  date: number
  /** 是否属于当月（非当月日期为上月末/下月初的填充） */
  isCurrent: boolean
  /** 任务 ID 数组（仅当月日期有数据） */
  tasks?: (string | number)[]
  /** 任务占用的小时数组，用于时间条可视化（仅当月日期有数据） */
  taskHours?: number[]
}

// useMonthView composable 的返回值类型
export interface UseMonthViewReturn {
  /** 当前选中月份的信息 */
  selectedMonth: ComputedRef<SelectedMonthInfo>
  /** 42格日历网格数据（6周×7天） */
  monthGridData: ComputedRef<MonthGridCell[]>
  /** 返回年度视图 */
  goBackToYear: () => void
  /** 进入指定日期的日视图 */
  enterDay: (date: number) => void
  /** 页面加载状态 */
  isPageLoading: Ref<boolean>
}

/**
 * 月度日历视图逻辑
 *
 * 使用场景：Month 页面，展示月度日历网格和任务分布
 * 数据流：路由参数 → routeDateContext → fetchMonthTasks → monthGridData 计算 → 组件渲染
 */
export const useMonthView = (): UseMonthViewReturn => {
  // 页面加载状态，控制骨架屏展示
  const isPageLoading = ref(false)

  // 当月所有任务列表，按时间范围查询
  const tasks = ref<Task[]>([])

  const route = useRoute()
  const router = useRouter()
  const dateStore = useDateStore()

  // 路由日期上下文：解析路由参数中的年月，处理无效/缺失参数
  const routeDateContext = computed(() => getRouteMonthContext(
    route.params.year as string,
    route.params.month as string,
    dateStore.currentDate
  ))

  // 从路由上下文提取的年份
  const routeYear = computed((): number => routeDateContext.value.year)

  // 从路由上下文提取的月份（1-12）
  const routeMonth = computed((): number => routeDateContext.value.month)

  // 根据路由年份和月份计算该月的详细信息
  const selectedMonth = computed((): SelectedMonthInfo => {
    const currentYear = routeYear.value
    const monthNum = routeMonth.value
    const monthZeroBased = monthNum - 1

    return {
      name: getMonthName(monthNum, 'en'),
      days: getDaysInMonth(currentYear, monthNum),
      firstDayOffset: getFirstDayOffset(currentYear, monthNum),
      index: monthZeroBased
    }
  })

  // 将全局日期状态同步到路由指定的年月，保持 dateStore 与路由一致
  const syncDateWithRoute = (): void => {
    // setYearMonthDay 接受零基月份，所以 routeMonth - 1
    dateStore.setYearMonthDay(routeYear.value, routeMonth.value - 1, 1)
  }

  /**
   * 校验月度路由参数的合法性
   *
   * 处理两种异常：
   * 1. 月份不在 1-12 范围内 → 重定向到年度视图
   * 2. 路由格式不规范（如 /month/2024/1）→ 重定向到规范格式（/month/2024/01）
   */
  const validateMonthRoute = (): boolean => {
    const context = routeDateContext.value

    if (context.month < 1 || context.month > 12) {
      // 优先使用路由解析的年份，否则使用 store 中的当前年份
      const targetYear = context.hasParsedYear
        ? new Date(context.year, 0, 1).getFullYear()
        : dateStore.currentDate.getFullYear()
      router.replace(buildYearPath(targetYear))
      return false
    }

    // 检查路由格式是否规范，不规范时重定向到带前导零的标准格式
    if (!context.isCanonical) {
      const targetDate = new Date(context.year, context.month - 1, 1)
      router.replace(buildMonthPath(targetDate.getFullYear(), targetDate.getMonth() + 1))
      return false
    }

    return true
  }

  // 从数据库获取当月所有任务，按自然月范围查询
  const fetchMonthTasks = async (): Promise<void> => {
    isPageLoading.value = true
    const monthZeroBased = routeMonth.value - 1
    const currentYear = routeYear.value

    const start = new Date(currentYear, monthZeroBased, 1)
    const end = new Date(currentYear, monthZeroBased + 1, 0, 23, 59, 59)

    try {
      tasks.value = await db.task.list(start, end)
    } catch (e) {
      console.error('获取月度任务失败:', e)
    } finally {
      isPageLoading.value = false
    }
  }

  // 路由同步主函数：校验 → 日期同步 → 数据获取，返回 false 表示已重定向
  const handleRouteSync = async (): Promise<boolean> => {
    if (!validateMonthRoute()) return false
    syncDateWithRoute()
    await fetchMonthTasks()
    return true
  }

  // 组件挂载时执行初始同步
  onMounted(handleRouteSync)

  // 路由参数变化时重新同步（监听 year 和 month 参数）
  watch(() => [route.params.year, route.params.month], handleRouteSync)

  /**
   * 月度日历网格数据：42 格（6周×7天）
   *
   * 包含上月末尾填充、当月日期（含任务数据）、下月初填充。
   * taskHours 用于在日历格子中渲染任务时间条。
   */
  const monthGridData = computed((): MonthGridCell[] => {
    const currentYear = routeYear.value
    const grid: MonthGridCell[] = []
    const { index, days, firstDayOffset } = selectedMonth.value
    const prevMonthLastDay = new Date(currentYear, index, 0).getDate()

    // 按天分组任务，便于后续快速查找
    const tasksByDay = new Map<number, Task[]>()
    for (const t of tasks.value) {
      const d = new Date(t.start_time ?? '')
      if (d.getFullYear() === currentYear && d.getMonth() === index) {
        const day = d.getDate()
        if (!tasksByDay.has(day)) tasksByDay.set(day, [])
        tasksByDay.get(day)!.push(t)
      }
    }

    // 填充上月末尾日期（非当月标记）
    for (let i = firstDayOffset - 1; i >= 0; i--) {
      grid.push({ date: prevMonthLastDay - i, isCurrent: false })
    }

    // 填充当月日期，计算每个任务占用的小时区间
    for (let i = 1; i <= days; i++) {
      const dayTasks = tasksByDay.get(i) || []
      const taskHours = dayTasks.flatMap((task) => {
        const dStart = new Date(task.start_time ?? '')
        const dEnd = new Date(task.end_time ?? '')
        const startHour = dStart.getHours() + dStart.getMinutes() / 60
        const endHour = dEnd.getHours() + dEnd.getMinutes() / 60
        const hours: number[] = []
        for (let h = Math.floor(startHour); h < Math.ceil(endHour); h++) {
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

    // 填充下月初日期，补齐到 42 格
    while (grid.length < 42) {
      grid.push({ date: grid.length - days - firstDayOffset + 1, isCurrent: false })
    }

    return grid
  })

  // 返回年度视图
  const goBackToYear = (): void => {
    router.push(buildYearPath(routeYear.value))
  }

  // 进入指定日期的日视图
  const enterDay = (date: number): void => {
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
