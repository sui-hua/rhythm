/**
 * ============================================
 * Month 视图逻辑层 (views/month/composables/useMonthView.js)
 * ============================================
 *
 * 【模块职责】
 * - 月度视图的数据获取和状态管理
 * - 月份天数和日历网格计算
 * - 路由校验与自动跳转
 *
 * 【数据结构 - monthGridData】
 * - 42 格的日历网格（6 周）
 * - 每个格子包含：date（日期）、isCurrent（是否当月）、tasks（任务 ID 数组）
 *
 * 【路由参数】
 * - /month/:year/:month
 * - 自动补全和合法性校验
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName, getDaysInMonth, getFirstDayOffset } from '@/utils/dateFormatter'
import {
  buildDayPath,
  buildMonthPath,
  buildYearPath,
  getRouteMonthContext
} from '@/views/day/utils/routeDateContext'

/**
 * Month 视图的 Composition API hook
 * 负责月度日历视图的数据获取、状态管理和路由同步
 *
 * @returns {Object} 月度视图相关的响应式状态和方法
 * @returns {ComputedRef<Object>} returns.selectedMonth - 当前选中月份的信息（名称、天数、首日偏移、索引）
 * @returns {ComputedRef<Array>} returns.monthGridData - 42格日历网格数据
 * @returns {Function} returns.goBackToYear - 返回年度视图
 * @returns {Function} returns.enterDay - 进入指定日期的日视图
 * @returns {Ref<boolean>} returns.isPageLoading - 页面加载状态
 */
export const useMonthView = () => {
  /** @type {Ref<boolean>} 页面加载状态标志 */
  const isPageLoading = ref(false)

  /** @type {Ref<Array>} 当月所有任务列表 */
  const tasks = ref([])
  const route = useRoute()
  const router = useRouter()
  const dateStore = useDateStore()

  /**
   * 路由日期上下文计算属性
   * 解析路由参数中的年月，并处理无效/缺失参数的情况
   * @type {ComputedRef<Object>}
   * @property {number} year - 年份
   * @property {number} month - 月份（1-12）
   * @property {boolean} hasParsedYear - 是否从路由解析到年份
   * @property {boolean} isCanonical - 路由格式是否规范
   */
  const routeDateContext = computed(() => getRouteMonthContext(
    route.params.year,
    route.params.month,
    dateStore.currentDate
  ))

  /** @type {ComputedRef<number>} 从路由上下文提取的年份 */
  const routeYear = computed(() => routeDateContext.value.year)

  /** @type {ComputedRef<number>} 从路由上下文提取的月份（1-12） */
  const routeMonth = computed(() => routeDateContext.value.month)

  /**
   * 选中月份详情计算属性
   * 根据路由年份和月份计算该月的详细信息
   *
   * @type {ComputedRef<Object>}
   * @property {string} name - 月份英文名称
   * @property {number} days - 该月总天数
   * @property {number} firstDayOffset - 首日距离周一的天数偏移（0=周一, 1=周二, ..., 6=周日）
   * @property {number} index - 月份索引（0-11，0=一月）
   */
  const selectedMonth = computed(() => {
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

  /**
   * 将 dateStore 的日期同步到路由指定的年月
   * 当路由变化时更新全局日期状态
   */
  const syncDateWithRoute = () => {
    // setYearMonthDay 接受零基月份，所以 routeMonth - 1
    dateStore.setYearMonthDay(routeYear.value, routeMonth.value - 1, 1)
  }

  /**
   * 校验月度路由参数的合法性
   * 处理两种异常情况：
   * 1. 月份不在 1-12 范围内 → 重定向到年度视图
   * 2. 路由格式不规范（如缺少前导零）→ 重定向到规范格式
   *
   * @returns {boolean} 校验是否通过
   */
  const validateMonthRoute = () => {
    const context = routeDateContext.value

    // 检查月份是否在有效范围内
    if (context.month < 1 || context.month > 12) {
      // 优先使用路由解析的年份，否则使用 store 中的当前年份
      const targetYear = context.hasParsedYear
        ? new Date(context.year, 0, 1).getFullYear()
        : dateStore.currentDate.getFullYear()
      router.replace(buildYearPath(targetYear))
      return false
    }

    // 检查路由格式是否规范（如 /month/2024/1 应重定向到 /month/2024/01）
    if (!context.isCanonical) {
      const targetDate = new Date(context.year, context.month - 1, 1)
      router.replace(buildMonthPath(targetDate.getFullYear(), targetDate.getMonth() + 1))
      return false
    }

    return true
  }

  /**
   * 从数据库获取当月所有任务
   * 按自然月范围查询：月初 00:00:00 到月末 23:59:59
   */
  const fetchMonthTasks = async () => {
    isPageLoading.value = true
    const monthZeroBased = routeMonth.value - 1
    const currentYear = routeYear.value

    // 构造当月时间范围
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

  /**
   * 路由同步处理主函数
   * 依次执行：路由校验 → 日期同步 → 数据获取
   *
   * @returns {Promise<boolean>} 处理是否成功
   */
  const handleRouteSync = async () => {
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
   * 月度日历网格数据计算属性
   * 生成 42 格（6周×7天）的日历网格，包含：
   * - 上月末尾几天的填充日期
   * - 当月所有日期及其任务
   * - 下月初几天的填充日期
   *
   * @type {ComputedRef<Array<Object>>}
   * @example grid item: { date: 15, isCurrent: true, tasks: [1, 2, 3], taskHours: [9, 10, 11, 14] }
   */
  const monthGridData = computed(() => {
    const currentYear = routeYear.value
    const grid = []
    const { index, days, firstDayOffset } = selectedMonth.value
    const prevMonthLastDay = new Date(currentYear, index, 0).getDate()

    const tasksByDay = new Map()
    for (const t of tasks.value) {
      const d = new Date(t.start_time)
      if (d.getFullYear() === currentYear && d.getMonth() === index) {
        const day = d.getDate()
        if (!tasksByDay.has(day)) tasksByDay.set(day, [])
        tasksByDay.get(day).push(t)
      }
    }

    for (let i = firstDayOffset - 1; i >= 0; i--) {
      grid.push({ date: prevMonthLastDay - i, isCurrent: false })
    }

    for (let i = 1; i <= days; i++) {
      const dayTasks = tasksByDay.get(i) || []
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

  /**
   * 返回年度视图
   * 导航到 /year/:year 路由
   */
  const goBackToYear = () => {
    router.push(buildYearPath(routeYear.value))
  }

  /**
   * 进入指定日期的日视图
   * @param {number} date - 日期（1-31）
   */
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
