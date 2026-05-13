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
 *
 * @module useYearView
 * @description 年度总览视图的组合式函数，负责年度习惯数据的聚合、展示和路由同步
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { buildMonthPath, buildYearPath, getRouteYearContext } from '@/views/day/utils/routeDateContext'

/**
 * 年度总览视图的组合式函数
 * @description 整合年度习惯数据的获取、解析、展示和路由同步逻辑
 * @returns {Object} 视图状态和方法
 * @returns {Array} returns.yearData - 12个月的打卡数据数组，用于渲染年度热力图
 * @returns {Function} returns.enterMonth - 跳转到指定月份视图的导航方法
 * @returns {Ref<boolean>} returns.isPageLoading - 页面加载状态
 */
export const useYearView = () => {
  /** @type {import('vue').Ref<boolean>} 页面级加载状态 */
  const isPageLoading = ref(false)

  /** @type {import('vue').Ref<Array>} 当前年度所有未归档的习惯列表 */
  const habits = ref([])

  /** @type {import('vue').Ref<Array>} 当前年度所有习惯的打卡日志 */
  const yearLogs = ref([])
  const route = useRoute()
  const router = useRouter()
  const dateStore = useDateStore()

  /**
   * 从路由参数解析出的年份
   * @description 通过 getRouteYearContext 校验并规范化年份，支持自动补全和合法性校验
   * @type {import('vue').ComputedRef<number>}
   */
  const routeYear = computed(() => getRouteYearContext(route.params.year, dateStore.currentDate.getFullYear()).year)

  /** @type {import('vue').Ref<boolean>} 标记习惯数据是否已获取，防止重复请求 */
  const hasFetchedHabits = ref(false)

  /**
   * 获取所有未归档的习惯列表
   * @description 从数据库加载习惯数据，过滤掉已归档(is_archived=true)的习惯
   * @returns {Promise<void>}
   */
  const fetchHabits = async () => {
    isPageLoading.value = true
    try {
      const allHabits = await db.habit.list()
      // 过滤掉已归档的习惯，只保留活跃习惯
      habits.value = allHabits.filter((habit) => !habit.is_archived)
    } catch (e) {
      console.error('Failed to fetch habits', e)
    } finally {
      isPageLoading.value = false
    }
  }

  /**
   * 获取指定年份的所有打卡日志
   * @description 调用数据库接口获取整年的习惯打卡记录，用于聚合统计
   * @param {number} year - 目标年份
   * @returns {Promise<void>}
   */
  const fetchYearLogs = async (year) => {
    try {
      yearLogs.value = await db.habit.listLogsByYear(year)
    } catch (e) {
      console.error('Failed to fetch year logs', e)
      yearLogs.value = []
    }
  }

  /**
   * 同步路由年份与当前视图状态
   * @description 核心路由处理函数，负责：
   * 1. 校验路由年份的合法性，非规范格式自动重定向
   * 2. 更新 dateStore 的年份状态
   * 3. 按需加载习惯数据和年度日志
   * @returns {Promise<boolean>} 返回 true 表示路由合法且数据加载成功，false 表示已重定向
   */
  const syncYearRoute = async () => {
    // 解析路由年份上下文，包含规范化年份和合法性标志
    const context = getRouteYearContext(route.params.year, dateStore.currentDate.getFullYear())

    // 非规范路由（如缺少年份、格式错误）需要重定向到规范路径
    if (!context.isCanonical) {
      const targetYear = context.hasParsedYear
        ? new Date(context.year, 0, 1).getFullYear()
        : dateStore.currentDate.getFullYear()
      router.replace(buildYearPath(targetYear))
      return false
    }

    // 更新全局日期状态，设为该年1月1日
    dateStore.setYearMonthDay(context.year, 0, 1)

    // 首次进入时加载习惯列表（仅执行一次）
    if (!hasFetchedHabits.value) {
      await fetchHabits()
      hasFetchedHabits.value = true
    }

    // 加载该年度的打卡日志
    await fetchYearLogs(context.year)

    return true
  }

  // 页面挂载时执行初始同步
  onMounted(syncYearRoute)
  // 路由参数 year 变化时重新同步（如点击不同年份）
  watch(() => route.params.year, syncYearRoute)

  /**
   * 计算年度数据（供视图渲染使用）
   * @description 根据年度打卡日志聚合出每月数据：
   * - 遍历所有打卡记录，按月份分组统计已打卡天数
   * - 计算每月第一天是周几（用于日历对齐）
   * @type {import('vue').ComputedRef<Array>}
   */
  const yearData = computed(() => {
    const currentYear = routeYear.value
    /** @type {Map<number, Set<number>>} 按月索引存储已打卡日期集合 */
    const completedByMonth = new Map()

    // 聚合年度打卡数据：筛选当年记录，按月-日二级分组
    yearLogs.value.forEach((log) => {
      const d = new Date(log.completed_at)
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth() // 0-11 月份索引
        const day = d.getDate() // 1-31 日期
        if (!completedByMonth.has(m)) completedByMonth.set(m, new Set())
        completedByMonth.get(m).add(day)
      }
    })

    // 构建 12 个月的数据数组
    const result = []
    for (let m = 1; m <= 12; m++) {
      const index = m - 1 // 0-11 索引
      const name = getMonthName(m, 'en') // 英文月份名
      const daysInMonth = new Date(currentYear, m, 0).getDate() // 该月总天数
      result.push({
        name, // 英文月份名
        days: daysInMonth, // 该月天数
        firstDayOffset: (new Date(currentYear, index, 1).getDay() + 6) % 7, // 周一偏移（0=周一）
        index, // 月份索引 0-11
        completedDays: completedByMonth.has(index)
          ? Array.from(completedByMonth.get(index)) // 该月已打卡日期数组
          : []
      })
    }

    return result
  })

  /**
   * 进入指定月份的视图
   * @description 点击月度区块时导航到 /month/:year/:month 路由
   * @param {Object} month - 月份数据对象（包含 index 属性）
   * @param {number} month.index - 月份索引（0-11）
   */
  const enterMonth = (month) => {
    // index + 1 转为 1-12 月份，路由参数使用 1-12
    router.push(buildMonthPath(routeYear.value, month.index + 1))
  }

  return {
    /** @type {Array} 12个月的打卡统计数据，用于渲染年度热力图 */
    yearData,
    /** @type {Function} 导航到月度视图 */
    enterMonth,
    /** @type {Ref<boolean>} 页面加载状态 */
    isPageLoading
  }
}
