/**
 * @fileOverview Direction 模块目标管理 Composable
 * @description 提供方向/目标（Goal）的增删改查操作封装，管理月度计划与年度目标的映射关系。
 *              采用 plans → monthlyPlans → dailyPlans 三级级联结构。
 *
 * - plans: 年度目标（跨多个月份）
 * - monthlyPlans: 月度计划（按月拆分）
 * - dailyPlans: 日计划（按日拆分，暂不在此模块处理）
 *
 * @module direction/goals
 * @requires vue
 * @requires stores/authStore
 * @requires services/database
 */

import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { getDateOnlyMonth } from '@/views/direction/utils/dateOnly'
import { useDirectionState } from '@/views/direction/composables/useDirectionState'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'

/**
 * Direction 模块目标（Goal）管理 Composable
 * @description 封装目标的新增、编辑、更新、删除等写操作，协同 useDirectionState 和 useDirectionFetch
 *              完成数据的持久化与状态同步。
 *
 * @returns {Object} 目标管理相关状态与方法
 * @returns {Array}   returns.months - 月份列表（从 useDirectionState 获取）
 * @returns {Ref}     returns.selectedGoal - 当前选中的目标（从 useDirectionState 获取）
 * @returns {Ref}     returns.editingGoal - 正在编辑的目标（从 useDirectionState 获取）
 * @returns {Ref}     returns.activePicker - 日期选择器激活状态（从 useDirectionState 获取）
 * @returns {Ref}     returns.showAddModal - 新增/编辑弹窗显隐（从 useDirectionState 获取）
 * @returns {Ref}     returns.showCategoryModal - 分类弹窗显隐（从 useDirectionState 获取）
 * @returns {Array}   returns.monthlyMainGoals - 月度主目标列表（从 useDirectionState 获取）
 * @returns {ComputedRef<Array>} returns.activeMonthRange - 选中目标的有效月份区间（computed）
 * @returns {Function} returns.handleAddClick - 打开新增目标弹窗
 * @returns {Function} returns.handleEditGoal - 打开编辑目标弹窗
 * @returns {Function} returns.handleAddGoal - 创建新目标
 * @returns {Function} returns.handleUpdateGoal - 更新已有目标
 * @returns {Function} returns.handleDeleteGoal - 删除目标
 * @returns {Function} returns.handleConfirmRange - 确认月份区间变更
 * @returns {Function} returns.saveMonthlyPlan - 保存单个月度计划的详情
 * @returns {Ref<boolean>} returns.isSubmitting - 写操作进行中的 loading 状态
 */
export function useDirectionGoals() {
  const authStore = useAuthStore()
  const { fetchData, loadMonthlyPlans } = useDirectionFetch()

  const {
    months,
    monthlyPlans,
    monthlyPlansCache,
    monthlyMainGoals,
    selectedGoal,
    editingGoal,
    selectedMonth,
    activePicker,
    showAddModal,
    showCategoryModal,
    getMonthlyPlansByPlanId
  } = useDirectionState()

  // 写操作按钮 loading 状态
  const isSubmitting = ref(false)

  /**
   * 选中目标的有效月份区间
   * @description 根据 selectedGoal 对应的 monthlyPlansCache，计算该目标跨越的所有月份列表。
   *              用于月份范围选择器，显示可选择的月份范围。
   * @returns {Array<number>} 月份数字列表（如 [1,2,3,4,5,6]），无数据时返回空数组
   */
  const activeMonthRange = computed(() => {
    if (!selectedGoal.value) return []
    const cached = monthlyPlansCache[selectedGoal.value.plan_id] || []
    if (cached.length === 0) return []

    const months = cached
      .map(mp => getDateOnlyMonth(mp.month))
      .filter(m => m !== null)

    if (months.length === 0) return []

    const minMonth = Math.min(...months)
    const maxMonth = Math.max(...months)
    const range = []
    for (let i = minMonth; i <= maxMonth; i++) range.push(i)
    return range
  })

  /**
   * 打开新增目标弹窗
   * @description 重置 editingGoal 为 null，弹出新增目标模态框。
   *              新增模式下 editingGoal 为 null，编辑模式下 editingGoal 有值，以此区分两种行为。
   */
  const handleAddClick = () => {
    editingGoal.value = null
    showAddModal.value = true
  }

  /**
   * 打开编辑目标弹窗
   * @description 根据传入的目标对象，加载其关联的月度计划，确定起止月份后设置 editingGoal 并打开弹窗。
   *              如果月度计划缓存不存在，先调用 loadMonthlyPlans 加载。
   * @param {Object} goal - 要编辑的目标对象，需包含 plan_id、startMonth、endMonth 等字段
   * @returns {Promise<void>}
   */
  const handleEditGoal = async (goal) => {
    if (!monthlyPlansCache[goal.plan_id]) {
      await loadMonthlyPlans(goal.plan_id)
    }
    const relatedMonthlyPlans = getMonthlyPlansByPlanId(goal.plan_id)

    let minMonth = 12
    let maxMonth = 1

    if (relatedMonthlyPlans.length > 0) {
      const months = relatedMonthlyPlans
        .map(mp => (mp.month ? getDateOnlyMonth(mp.month) : null))
        .filter(m => m !== null)

      if (months.length > 0) {
        minMonth = Math.min(...months)
        maxMonth = Math.max(...months)
      } else {
        minMonth = goal.startMonth
        maxMonth = goal.endMonth
      }
    } else {
      minMonth = goal.startMonth
      maxMonth = goal.endMonth
    }

    editingGoal.value = {
      ...goal,
      startMonth: minMonth,
      endMonth: maxMonth
    }
    showAddModal.value = true
  }

  /**
   * 更新目标核心数据（内部方法）
   * @description 执行目标信息的更新逻辑，包括：
   *              1. 更新 plans 表中的目标基本信息（标题、分类、时长等）
   *              2. 对已有的 monthlyPlans：更新标题；删除不在目标月份区间的记录
   *              3. 对目标月份区间内不存在的 monthlyPlans：创建新记录
   *              4. 完成后调用 fetchData() 刷新全局数据
   *
   * @param {Object} goalToUpdate - 目标对象，需包含 plan_id、startMonth、endMonth
   * @param {string} [newTitle] - 新标题（可选）
   * @param {number|string} [newCategoryId] - 新分类 ID（可选）
   * @param {string} [newTaskTime] - 新默认时间（可选）
   * @param {number} [newDuration] - 新时长分钟数（可选）
   * @returns {Promise<boolean>} 更新是否成功
   */
  const updateGoalData = async (goalToUpdate, newTitle, newCategoryId, newTaskTime, newDuration) => {
    try {
      const planId = goalToUpdate.plan_id
      const year = new Date().getFullYear()

      if (planId && (newTitle !== undefined || newCategoryId !== undefined || newTaskTime !== undefined || newDuration !== undefined)) {
        const updates = {}
        if (newTitle !== undefined) updates.title = newTitle
        if (newCategoryId !== undefined) updates.category_id = newCategoryId
        if (newTaskTime !== undefined) updates.task_time = newTaskTime
        if (newDuration !== undefined) updates.duration = newDuration

        await db.plans.update(planId, updates)
      }

      const currentTitle = newTitle !== undefined ? newTitle : goalToUpdate.title

      const existingMonthlyPlans = getMonthlyPlansByPlanId(planId)
      const existingMonths = existingMonthlyPlans
        .map(mp => getDateOnlyMonth(mp.month))
        .filter(m => m !== null)

      const startM = goalToUpdate.startMonth || 1
      const endM = goalToUpdate.endMonth || startM
      const targetMonths = []
      for (let m = startM; m <= endM; m++) targetMonths.push(m)

      const createPromises = []
      for (const m of targetMonths) {
        if (!existingMonths.includes(m)) {
          createPromises.push(db.monthlyPlans.create({
            plan_id: planId,
            user_id: authStore.userId,
            title: currentTitle,
            description: goalToUpdate.description || '',
            month: `${year}-${String(m).padStart(2, '0')}-01`,
            status: 'active',
            priority: 2,
            task_time: null,
            duration: null
          }))
        }
      }

      const updatePromises = []
      if (newTitle !== undefined) {
        updatePromises.push(...existingMonthlyPlans.map(mp => db.monthlyPlans.update(mp.id, { title: newTitle })))
      }

      const toDelete = existingMonthlyPlans.filter(mp => {
        const m = getDateOnlyMonth(mp.month)
        return !targetMonths.includes(m)
      })

      const deletePromises = toDelete.map(mp => db.monthlyPlans.delete(mp.id))

      await Promise.all([...createPromises, ...updatePromises, ...deletePromises])
      await fetchData()
      return true
    } catch (e) {
      console.error('Update goal failed:', e)
      return false
    }
  }

  /**
   * 确认更新目标
   * @description 包装 updateGoalData，添加 loading 控制和弹窗关闭逻辑。
   *              仅在 isSubmitting 为 false 且有正在编辑的目标时才执行。
   * @param {Object} updatedGoal - 更新后的目标数据，需包含 title、category_id、task_time、duration
   * @returns {Promise<void>}
   */
  const handleUpdateGoal = async (updatedGoal) => {
    if (!editingGoal.value || isSubmitting.value) return

    isSubmitting.value = true
    const success = await updateGoalData(
      editingGoal.value,
      updatedGoal.title,
      updatedGoal.category_id,
      updatedGoal.task_time,
      updatedGoal.duration
    )
    isSubmitting.value = false

    if (success) {
      showAddModal.value = false
    }
  }

  /**
   * 保存单个月度计划的详情
   * @description 根据月份找到对应的 monthlyPlan 并更新其详情（如 task_time、duration 等字段）。
   *              用于用户在月度视图中修改单个月的计划安排。
   * @param {number} m - 月份数字（1-12）
   * @param {Object} payload - 要更新的字段，如 { task_time, duration }
   * @returns {Promise<void>}
   */
  const saveMonthlyPlan = async (m, payload) => {
    const currentMp = getMonthlyPlansByPlanId(selectedGoal.value.plan_id).find(
      mp => getDateOnlyMonth(mp.month) === m
    )
    if (currentMp) {
      try {
        await db.monthlyPlans.update(currentMp.id, payload)
      } catch (e) {
        console.error('Failed to save monthly plan details', e)
      }
    }
  }

  /**
   * 创建新目标
   * @description 在 plans 表中创建年度目标，同时在 monthlyPlans 表中创建该目标在指定月份区间内的所有月度计划。
   *              包含以下步骤：
   *              1. 校验用户已登录（authStore.userId）
   *              2. 在 plans 表创建目标记录
   *              3. 循环创建 startMonth ~ endMonth 对应的 monthlyPlans 记录
   *              4. 调用 loadMonthlyPlans 加载新创建的计划
   *              5. 关闭新增弹窗
   * @param {Object} newGoal - 新目标数据，需包含 title、startMonth、endMonth、description、category_id、task_time、duration
   * @returns {Promise<void>}
   */
  const handleAddGoal = async (newGoal) => {
    if (isSubmitting.value) return

    isSubmitting.value = true
    try {
      if (!authStore.userId) {
        console.error('User ID not available')
        return
      }

      const year = new Date().getFullYear()
      const startM = newGoal.startMonth || 1
      const endM = newGoal.endMonth || startM

      const planData = {
        user_id: authStore.userId,
        title: newGoal.title,
        description: newGoal.description || '',
        year: `${year}-01-01`,
        category_id: newGoal.category_id || null,
        task_time: newGoal.task_time || '09:00',
        duration: newGoal.duration || 30,
        status: 'active',
        priority: 2,
      }

      const createdPlan = await db.plans.create(planData)

      const promises = []
      for (let m = startM; m <= endM; m++) {
        const monthlyPlanData = {
          plan_id: createdPlan.id,
          user_id: authStore.userId,
          title: newGoal.title,
          description: newGoal.description || '',
          month: `${year}-${String(m).padStart(2, '0')}-01`,
          status: 'active',
          priority: 2,
          task_time: null,
          duration: null
        }
        promises.push(db.monthlyPlans.create(monthlyPlanData))
      }

      await Promise.all(promises)
      await loadMonthlyPlans(createdPlan.id)
      showAddModal.value = false
    } catch (e) {
      console.error('Add goal failed:', e)
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * 删除目标
   * @description 删除指定目标及其所有关联的月度计划（monthlyPlans），同时重置选中状态并关闭弹窗。
   *              plans 表的删除依靠数据库级联配置自动完成，无需手动删除。
   *              删除后会调用 fetchData() 刷新全局数据。
   * @returns {Promise<void>}
   */
  const handleDeleteGoal = async () => {
    if (!editingGoal.value || isSubmitting.value) return

    isSubmitting.value = true
    try {
      const planId = editingGoal.value.plan_id
      if (!planId) return

      const relatedMonthlyPlans = getMonthlyPlansByPlanId(planId)

      // 靠数据库级联删除，只需删 monthlyPlans
      await Promise.all(relatedMonthlyPlans.map(mp => db.monthlyPlans.delete(mp.id)))

      await db.plans.delete(planId)

      if (selectedGoal.value && selectedGoal.value.plan_id === planId) {
        selectedGoal.value = null
        selectedMonth.value = null
      }

      await fetchData()
      showAddModal.value = false
    } catch (e) {
      console.error('Delete goal failed:', e)
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * 确认月份区间变更
   * @description 在月份范围选择器中确认后，更新 selectedGoal 的起止月份，并调用 updateGoalData 持久化。
   *              用于调整目标跨越的月份范围（提前结束或延长）。
   * @param {Object} param - 包含 start 和 end 月份数字
   * @param {number} param.start - 起始月份（1-12）
   * @param {number} param.end - 结束月份（1-12）
   * @returns {Promise<void>}
   */
  const handleConfirmRange = async ({ start, end }) => {
    if (!selectedGoal.value) return

    const goalToUpdate = {
      ...selectedGoal.value,
      startMonth: start,
      endMonth: end
    }

    await updateGoalData(goalToUpdate)
  }

  return {
    months,
    selectedGoal,
    editingGoal,
    activePicker,
    showAddModal,
    showCategoryModal,
    monthlyMainGoals,

    activeMonthRange,
    handleAddClick,
    handleEditGoal,
    handleAddGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleConfirmRange,
    saveMonthlyPlan,
    isSubmitting
  }
}
