import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { getDateOnlyMonth } from '@/views/direction/utils/dateOnly'
import {
  months,
  goalMonths,
  goalMonthsCache,
  goalMonthsMap,
  selectedGoal,
  editingGoal,
  selectedMonth,
  activePicker,
  showAddModal,
  showCategoryModal,
  getGoalMonthsByGoalId
} from '@/views/direction/composables/useDirectionState'

import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'

export function useDirectionGoals() {
  const authStore = useAuthStore()
  const { fetchData, loadGoalMonths } = useDirectionFetch()

  // 写操作按钮 loading 状态
  const isSubmitting = ref(false)

  const resolvePlanTiming = (source = {}, fallback = {}) => ({
    task_time: source.task_time ?? fallback.task_time ?? '09:00',
    duration: source.duration ?? fallback.duration ?? 30
  })

  const activeMonthRange = computed(() => {
    if (!selectedGoal.value) return []
    const cached = goalMonthsCache[selectedGoal.value.goal_id] || []
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

  const handleAddClick = () => {
    editingGoal.value = null
    showAddModal.value = true
  }

  const handleEditGoal = async (goal) => {
    if (!goalMonthsCache[goal.goal_id]) {
      await loadGoalMonths(goal.goal_id)
    }
    const relatedGoalMonths = getGoalMonthsByGoalId(goal.goal_id)

    let minMonth = 12
    let maxMonth = 1

    if (relatedGoalMonths.length > 0) {
      const months = relatedGoalMonths
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

  const updateGoalData = async (
    goalToUpdate,
    newTitle,
    newCategoryId,
    newTaskTime,
    newDuration,
    newCarryOverLookbackDays,
    newStartMonth,
    newEndMonth
  ) => {
    try {
      const goalId = goalToUpdate.goal_id
      const year = new Date().getFullYear()

      if (
        goalId &&
        (
          newTitle !== undefined ||
          newCategoryId !== undefined ||
          newTaskTime !== undefined ||
          newDuration !== undefined ||
          newCarryOverLookbackDays !== undefined
        )
      ) {
        const updates = {}
        if (newTitle !== undefined) updates.title = newTitle
        if (newCategoryId !== undefined) updates.category_id = newCategoryId
        if (newTaskTime !== undefined) updates.task_time = newTaskTime
        if (newDuration !== undefined) updates.duration = newDuration
        if (newCarryOverLookbackDays !== undefined) {
          updates.carry_over_lookback_days = newCarryOverLookbackDays
        }

        await db.goal.update(goalId, updates)
      }

      const currentTitle = newTitle !== undefined ? newTitle : goalToUpdate.title
      const currentTiming = resolvePlanTiming(
        { task_time: newTaskTime, duration: newDuration },
        goalToUpdate
      )

      const existingGoalMonths = getGoalMonthsByGoalId(goalId)
      const existingMonths = existingGoalMonths
        .map(mp => getDateOnlyMonth(mp.month))
        .filter(m => m !== null)

      const startM = newStartMonth !== undefined ? newStartMonth : (goalToUpdate.startMonth || 1)
      const endM = newEndMonth !== undefined ? newEndMonth : (goalToUpdate.endMonth || startM)
      const targetMonths = []
      for (let m = startM; m <= endM; m++) targetMonths.push(m)

      const createPromises = []
      for (const m of targetMonths) {
        if (!existingMonths.includes(m)) {
          createPromises.push(db.goalMonths.create({
            goal_id: goalId,
            user_id: authStore.userId,
            title: currentTitle,
            description: goalToUpdate.description || '',
            month: `${year}-${String(m).padStart(2, '0')}-01`,
            status: 'active',
            priority: 2,
            task_time: currentTiming.task_time,
            duration: currentTiming.duration
          }))
        }
      }

      const updatePromises = existingGoalMonths
        .map(mp => {
          const payload = {}
          if (newTitle !== undefined) payload.title = newTitle
          if (newTaskTime !== undefined && !mp.task_time) payload.task_time = currentTiming.task_time
          if (newDuration !== undefined && !mp.duration) payload.duration = currentTiming.duration
          return Object.keys(payload).length > 0 ? db.goalMonths.update(mp.id, payload) : null
        })
        .filter(Boolean)

      const toDelete = existingGoalMonths.filter(mp => {
        const m = getDateOnlyMonth(mp.month)
        return !targetMonths.includes(m)
      })

      const deletePromises = toDelete.map(mp => db.goalMonths.delete(mp.id))

      await Promise.all([...createPromises, ...updatePromises, ...deletePromises])
      await fetchData()
      return true
    } catch (e) {
      console.error('Update goal failed:', e)
      return false
    }
  }

  const handleUpdateGoal = async (updatedGoal) => {
    if (!editingGoal.value || isSubmitting.value) return

    isSubmitting.value = true
    const success = await updateGoalData(
      editingGoal.value,
      updatedGoal.title,
      updatedGoal.category_id,
      updatedGoal.task_time,
      updatedGoal.duration,
      updatedGoal.carry_over_lookback_days,
      updatedGoal.startMonth,
      updatedGoal.endMonth
    )
    isSubmitting.value = false

    if (success) {
      showAddModal.value = false
    }
  }

  const saveMonthlyPlan = async (m, payload) => {
    const currentMp = getGoalMonthsByGoalId(selectedGoal.value.goal_id).find(
      mp => getDateOnlyMonth(mp.month) === m
    )
    if (currentMp) {
      try {
        await db.goalMonths.update(currentMp.id, payload)
      } catch (e) {
        console.error('Failed to save monthly plan details', e)
      }
    }
  }

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
        // 目标级配置只影响 Day 页查询窗口，不改写 goal_days.day。
        carry_over_lookback_days: newGoal.carry_over_lookback_days || 0,
        status: 'active',
        priority: 2,
      }

      const createdPlan = await db.goal.create(planData)

      const promises = []
      for (let m = startM; m <= endM; m++) {
        const monthlyPlanData = {
          goal_id: createdPlan.id,
          user_id: authStore.userId,
          title: newGoal.title,
          description: newGoal.description || '',
          month: `${year}-${String(m).padStart(2, '0')}-01`,
          status: 'active',
          priority: 2,
          task_time: planData.task_time,
          duration: planData.duration
        }
        promises.push(db.goalMonths.create(monthlyPlanData))
      }

      await Promise.all(promises)
      await loadGoalMonths(createdPlan.id)
      await fetchData()
      showAddModal.value = false
    } catch (e) {
      console.error('Add goal failed:', e)
    } finally {
      isSubmitting.value = false
    }
  }

  const handleDeleteGoal = async () => {
    if (!editingGoal.value || isSubmitting.value) return

    isSubmitting.value = true
    try {
      const goalId = editingGoal.value.goal_id
      if (!goalId) return

      const relatedGoalMonths = getGoalMonthsByGoalId(goalId)

      // 靠数据库级联删除，只需删 goalMonths
      await Promise.all(relatedGoalMonths.map(mp => db.goalMonths.delete(mp.id)))

      await db.goal.delete(goalId)

      if (selectedGoal.value && selectedGoal.value.goal_id === goalId) {
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
    goalMonthsMap,

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
