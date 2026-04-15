/**
 * 方向模块目标管理 (useDirectionGoals.js)
 * 处理目标的增删改查、月度计划同步以及月份范围确认。
 */
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { safeDb as db } from '@/services/safeDb'
import {
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
} from '@/views/direction/composables/useDirectionState'
import { getIsoMonth } from '@/utils/dateParts'

import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'

export function useDirectionGoals() {
  const authStore = useAuthStore()
  const { fetchData, loadMonthlyPlans } = useDirectionFetch()

  const activeMonthRange = computed(() => {
    if (!selectedGoal.value) return []

    const cachedMonths = getMonthlyPlansByPlanId(selectedGoal.value.plan_id)
      .map(mp => getIsoMonth(mp.month))
      .filter(month => month !== null)

    const startMonth = cachedMonths.length > 0
      ? Math.min(...cachedMonths)
      : selectedGoal.value.startMonth
    const endMonth = cachedMonths.length > 0
      ? Math.max(...cachedMonths)
      : selectedGoal.value.endMonth

    if (!startMonth || !endMonth) return []

    const range = []
    for (let i = startMonth; i <= endMonth; i++) range.push(i)
    return range
  })

  const handleAddClick = () => {
    editingGoal.value = null
    showAddModal.value = true
  }

  const handleEditGoal = async (goal) => {
    if (!monthlyPlansCache[goal.plan_id]) {
      await loadMonthlyPlans(goal.plan_id)
    }
    const relatedMonthlyPlans = getMonthlyPlansByPlanId(goal.plan_id)

    let minMonth = 12
    let maxMonth = 1

    if (relatedMonthlyPlans.length > 0) {
      const months = relatedMonthlyPlans
        .map(mp => getIsoMonth(mp.month))
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
      const existingMonths = existingMonthlyPlans.map(mp => getIsoMonth(mp.month)).filter(m => m !== null)

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
        const m = getIsoMonth(mp.month)
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

  const handleUpdateGoal = async (updatedGoal) => {
    if (!editingGoal.value) return

    const success = await updateGoalData(
      editingGoal.value,
      updatedGoal.title,
      updatedGoal.category_id,
      updatedGoal.task_time,
      updatedGoal.duration
    )

    if (success) {
      showAddModal.value = false
    }
  }

  const saveMonthlyPlan = async (m, payload) => {
    const currentMp = getMonthlyPlansByPlanId(selectedGoal.value.plan_id).find(
      mp => getIsoMonth(mp.month) === m
    )
    if (currentMp) {
      try {
        await db.monthlyPlans.update(currentMp.id, payload)
      } catch (e) {
        console.error('Failed to save monthly plan details', e)
      }
    }
  }

  const handleAddGoal = async (newGoal) => {
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
      await fetchData()
      await loadMonthlyPlans(createdPlan.id)
      showAddModal.value = false
    } catch (e) {
      console.error('Add goal failed:', e)
    }
  }

  const handleDeleteGoal = async () => {
    if (!editingGoal.value) return

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
    monthlyMainGoals,

    activeMonthRange,
    handleAddClick,
    handleEditGoal,
    handleAddGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleConfirmRange,
    saveMonthlyPlan
  }
}
