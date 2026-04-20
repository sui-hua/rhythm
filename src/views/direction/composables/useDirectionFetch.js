/**
 * ============================================
 * Direction 数据获取层 (views/direction/composables/useDirectionFetch.js)
 * ============================================
 *
 * 【模块职责】
 * - 从数据库获取 plans、monthlyPlans、dailyPlans 数据
 * - 按分类整理目标列表
 * - 管理数据缓存，减少重复请求
 * - 支持按需加载（lazy load）
 *
 * 【数据流】
 * 1. fetchData() → 加载所有目标及月度计划
 * 2. loadMonthlyPlans(planId) → 按需加载某个目标的月计划
 * 3. loadDailyPlans(monthlyPlanId) → 按需加载某个月的日计划
 *
 * 【缓存机制】
 * - monthlyPlansCache → 按 planId 索引的月计划缓存
 * - dailyPlansCache → 按 monthlyPlanId 索引的日计划缓存
 *
 * 【Race Condition 修复】
 * - 所有数据通过 directionStore 管理，确保单一数据源
 * - 使用 Map 管理待处理的 planId，避免竞态条件
 *
 * @module useDirectionFetch
 * @see {@link https://github.com/example/rhythm} 项目地址
 * @requires vue
 * @requires @/services/database
 * @requires @/views/direction/utils/dateOnly
 * @requires @/views/direction/composables/useDirectionState
 */
import { computed, onMounted, watch, ref } from 'vue'
import { db } from '@/services/database'
import { parseDateOnly, getDateOnlyMonth } from '@/views/direction/utils/dateOnly'
import { useDirectionState } from '@/views/direction/composables/useDirectionState'

export { parseDateOnly } from '@/views/direction/utils/dateOnly'

/**
 * Direction 数据获取组合式函数
 *
 * 负责从数据库加载 plans、monthlyPlans、dailyPlans 数据，并管理缓存。
 * 通过 directionStore 共享状态，确保单一数据源。
 *
 * @returns {Object} 包含数据获取相关的方法和计算属性
 * @returns {Array<{category: string, items: Array}>}  returns.categorizedGoals - 按分类整理的目标列表
 * @returns {Function} returns.fetchData - 加载所有初始数据
 * @returns {Ref<boolean>} returns.isPageLoading - 页面加载状态
 * @returns {Function} returns.loadPlans - 加载所有目标
 * @returns {Function} returns.loadMonthlyPlans - 加载指定目标的月计划
 * @returns {Function} returns.loadDailyPlans - 加载指定月计划的日计划
 *
 * @example
 * const { categorizedGoals, fetchData, loadMonthlyPlans } = useDirectionFetch()
 */
export function useDirectionFetch() {
  const {
    plans,
    monthlyPlans,
    monthlyMainGoals,
    dailyTasks,
    selectedGoal,
    editingGoal,
    showAddModal,
    initialized,
    monthlyPlansCache,
    dailyPlansCache,
    syncMonthlyPlansToFlatList,
    selectedMonth,
    clearDailyPlansCache
  } = useDirectionState()

  const isPageLoading = ref(false)

  // Race condition fix: Track pending plan IDs to avoid duplicate fetches
  const pendingPlanIds = new Map() // planId -> promise

  /**
   * 将目标列表按分类组织成树形结构
   *
   * @returns {Array<{category: string, items: Array}>} 按分类分组的目标列表
   */
  const categorizedGoals = computed(() => {
    const map = new Map()
    for (const plan of plans.value) {
      const categoryName = plan.plans_category?.name || '未分类'
      if (!map.has(categoryName)) map.set(categoryName, [])

      map.get(categoryName).push({
        ...plan,
        name: plan.title,
        plan_id: plan.id,
        category_name: categoryName
      })
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
  })

  /**
   * 从数据库加载所有目标计划
   * @returns {Promise<void>}
   */
  const loadPlans = async () => {
    plans.value = await db.plans.list()
  }

  /**
   * 按需加载指定目标的月计划
   *
   * 包含竞态条件修复：检查缓存和 pending 请求，避免重复加载。
   * 加载完成后会同步到 monthlyMainGoals 和 monthlyPlansCache。
   *
   * @param {string|number} planId - 目标计划ID
   * @returns {Promise<Array>} 月计划数据数组
   */
  const loadMonthlyPlans = async (planId) => {
    // Race condition fix: Check both cache AND pending requests
    if (monthlyPlansCache[planId] || pendingPlanIds.has(planId)) return

    // Mark as pending before async operation
    const promise = (async () => {
      try {
        const data = await db.monthlyPlans.list(planId)
        monthlyPlansCache[planId] = data

        // Populate monthlyMainGoals for UI display
        for (const mp of data) {
          const month = getDateOnlyMonth(mp.month)
          if (month) {
            const key = `plan-${planId}-${month}`
            monthlyMainGoals[key] = mp
          }
        }

        syncMonthlyPlansToFlatList(planId)
        return data
      } finally {
        pendingPlanIds.delete(planId)
      }
    })()

    pendingPlanIds.set(planId, promise)
    return promise
  }

  /**
   * 按需加载指定月计划的日计划
   *
   * 包含竞态条件修复：检查缓存和 pending 请求，避免重复加载。
   * 加载完成后会解析日期并存储到 dailyTasks 中。
   *
   * @param {string|number} monthlyPlanId - 月计划ID
   * @param {Object} [options={}] - 配置选项
   * @param {boolean} [options.force=false] - 是否强制重新加载（忽略缓存）
   * @returns {Promise<void>}
   */
  const loadDailyPlans = async (monthlyPlanId, { force = false } = {}) => {
    // Race condition fix: Check both cache AND pending requests
    if (!force && (dailyPlansCache[monthlyPlanId] || pendingPlanIds.has(monthlyPlanId))) return

    const promise = (async () => {
      const dps = await db.dailyPlans.list(monthlyPlanId)
      dailyPlansCache[monthlyPlanId] = dps

      // Find the monthly plan to get plan_id and month
      let mp = null
      for (const cached of Object.values(monthlyPlansCache)) {
        mp = cached.find(item => item.id === monthlyPlanId)
        if (mp) break
      }
      if (!mp) return

      const monthDate = parseDateOnly(mp.month)
      if (!monthDate) return

      const month = monthDate.getMonth() + 1
      const prefix = `plan-${mp.plan_id}-${month}-`

      // Clear existing daily tasks for this plan-month
      for (const key of Object.keys(dailyTasks)) {
        if (key.startsWith(prefix)) delete dailyTasks[key]
      }

      for (const dp of dps) {
        const dayDate = parseDateOnly(dp.day)
        if (!dayDate) continue

        const day = dayDate.getDate()
        dailyTasks[`plan-${mp.plan_id}-${month}-${day}`] = dp
      }
    })()

    pendingPlanIds.set(monthlyPlanId, promise)
    return promise
  }

  /**
   * 初始化加载所有数据
   *
   * 页面首次加载时调用，加载所有目标、月计划，并默认选中第一个目标的第一个月。
   * 设置 isPageLoading 状态，并在加载完成后标记 initialized。
   *
   * @returns {Promise<void>}
   */
  const fetchData = async () => {
    isPageLoading.value = true
    try {
      plans.value = await db.plans.list()

      // 默认选中第一个目标
      if (plans.value.length > 0) {
        selectedGoal.value = categorizedGoals.value[0]?.items[0] || null
      }

      // 只加载默认选中目标的 monthlyPlans
      if (selectedGoal.value) {
        await loadMonthlyPlans(selectedGoal.value.plan_id)
        monthlyPlans.value = monthlyPlansCache[selectedGoal.value.plan_id] || []
      }

      // 选中第一个目标的第一个月，并预加载该月 dailyPlans
      if (selectedGoal.value && monthlyPlans.value.length > 0) {
        // 按月份排序，选中第一个月
        const sorted = [...monthlyPlans.value].sort((a, b) => {
          const mA = getDateOnlyMonth(a.month) || 0
          const mB = getDateOnlyMonth(b.month) || 0
          return mA - mB
        })
        const firstMp = sorted[0]
        if (firstMp) {
          const firstMonth = getDateOnlyMonth(firstMp.month)
          if (firstMonth) {
            selectedMonth.value = firstMonth
            // 预加载该月的 dailyPlans
            await loadDailyPlans(firstMp.id, { force: true })
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch direction data', e)
    } finally {
      isPageLoading.value = false
    }
  }

  // Setup watchers only once using a flag
  let setupDone = false

  /**
   * 设置响应式监听器
   *
   * 监听 showAddModal、selectedMonth、selectedGoal 的变化，
   * 自动触发相关数据的加载和缓存清理。只在首次调用时生效（setupDone 标志位）。
   */
  const setupWatchers = () => {
    if (setupDone) return
    setupDone = true

    watch(showAddModal, (val) => {
      if (!val) {
        setTimeout(() => { editingGoal.value = null }, 300)
      }
    })

    watch(selectedMonth, async (newMonth, oldMonth) => {
      if (!newMonth || newMonth === oldMonth) return
      if (!selectedGoal.value) return

      const planId = selectedGoal.value.plan_id
      if (!planId) return

      const cached = monthlyPlansCache[planId] || []
      const mp = cached.find(item => getDateOnlyMonth(item.month) === newMonth)
      if (!mp) return

      // 清空其他月份的缓存，只保留新的
      clearDailyPlansCache(mp.id)
      // 加载新月份的 dailyPlans
      await loadDailyPlans(mp.id, { force: true })
    })

    watch(selectedGoal, async (newGoal, oldGoal) => {
      if (!newGoal || newGoal === oldGoal) return

      const planId = newGoal.plan_id
      if (!planId) return

      // 加载新目标的 monthlyPlans
      await loadMonthlyPlans(planId)
      monthlyPlans.value = monthlyPlansCache[planId] || []

      // 选中第一个月并预加载
      if (monthlyPlans.value.length > 0) {
        const sorted = [...monthlyPlans.value].sort((a, b) => {
          const mA = getDateOnlyMonth(a.month) || 0
          const mB = getDateOnlyMonth(b.month) || 0
          return mA - mB
        })
        const firstMp = sorted[0]
        if (firstMp) {
          const firstMonth = getDateOnlyMonth(firstMp.month)
          if (firstMonth) {
            selectedMonth.value = firstMonth
            await loadDailyPlans(firstMp.id, { force: true })
          }
        }
      }
    })
  }

  onMounted(() => {
    setupWatchers()
    if (!initialized.value) {
      fetchData()
      initialized.value = true
    }
  })

  return {
    categorizedGoals,
    fetchData,
    isPageLoading,
    loadPlans,
    loadMonthlyPlans,
    loadDailyPlans
  }
}
