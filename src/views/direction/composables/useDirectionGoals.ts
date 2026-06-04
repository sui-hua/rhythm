/**
 * Direction 目标管理 composable。
 * 提供目标的增删改查、月度计划管理、弹窗控制等能力。
 */

import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { db } from '@/services/database'
import { getDateOnlyMonth } from '@/views/direction/utils/dateOnly'
import { months, useGoalDataStore } from '@/stores/goalDataStore'
import { useGoalSelectionStore } from '@/stores/goalSelectionStore'
import { useGoalBatchStore } from '@/stores/goalBatchStore'
import { storeToRefs } from 'pinia'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import type { GoalMonth, CreateGoalMonthPayload, UpdateGoalMonthPayload } from '@/services/db/goalMonths'
import type { GoalWithMeta, GoalFormData, DateRange, DirectionGoalsReturn } from '@/views/direction/types'

export function useDirectionGoals(): DirectionGoalsReturn {
  const authStore = useAuthStore()
  const dataStore = useGoalDataStore()
  const selectionStore = useGoalSelectionStore()
  const batchStore = useGoalBatchStore()
  const { goalMonths, showAddModal, showCategoryModal } = storeToRefs(dataStore)
  const { selectedGoal, editingGoal, selectedMonth, activePicker } = storeToRefs(selectionStore)

  // store 缓存引用，类型已在 store 定义中对齐
  const goalMonthsCache = dataStore.goalMonthsCache

  const { fetchData, loadGoalMonths } = useDirectionFetch()

  // 写操作按钮 loading 状态
  const isSubmitting = ref(false)

  /** 解析计划时间配置，带 fallback 链 */
  const resolvePlanTiming = (source: Partial<{ task_time: string; duration: number }> = {}, fallback: Partial<{ task_time: string; duration: number }> = {}): { task_time: string; duration: number } => ({
    task_time: source.task_time ?? fallback.task_time ?? '09:00',
    duration: source.duration ?? fallback.duration ?? 30
  })

  /** 当前目标已有的月度计划覆盖的月份范围 */
  const activeMonthRange = computed((): number[] => {
    if (!selectedGoal.value) return []
    const cached = goalMonthsCache[String(selectedGoal.value.goal_id)] || []
    if (cached.length === 0) return []

    const monthValues = cached
      .map(mp => getDateOnlyMonth(mp.month))
      .filter((m): m is number => m !== null)

    if (monthValues.length === 0) return []

    const minMonth = Math.min(...monthValues)
    const maxMonth = Math.max(...monthValues)
    const range: number[] = []
    for (let i = minMonth; i <= maxMonth; i++) range.push(i)
    return range
  })

  /** 打开新增弹窗 */
  const handleAddClick = (): void => {
    editingGoal.value = null
    showAddModal.value = true
  }

  /** 打开编辑弹窗：先加载月度计划，再推导可编辑的月份范围 */
  const handleEditGoal = async (goal: GoalWithMeta): Promise<void> => {
    if (!goalMonthsCache[String(goal.goal_id)]) {
      await loadGoalMonths(String(goal.goal_id))
    }
    const relatedGoalMonths = dataStore.getGoalMonthsByGoalId(String(goal.goal_id))

    let minMonth = 12
    let maxMonth = 1

    if (relatedGoalMonths.length > 0) {
      const monthValues = relatedGoalMonths
        .map(mp => (mp.month ? getDateOnlyMonth(mp.month) : null))
        .filter((m): m is number => m !== null)

      if (monthValues.length > 0) {
        minMonth = Math.min(...monthValues)
        maxMonth = Math.max(...monthValues)
      } else {
        minMonth = goal.startMonth ?? 1
        maxMonth = goal.endMonth ?? 12
      }
    } else {
      minMonth = goal.startMonth ?? 1
      maxMonth = goal.endMonth ?? 12
    }

    editingGoal.value = {
      ...goal,
      startMonth: minMonth,
      endMonth: maxMonth
    }
    showAddModal.value = true
  }

  /** 更新目标数据：同步 goal 表 + 创建/更新/删除月度计划 */
  const updateGoalData = async (
    goalToUpdate: GoalWithMeta,
    newTitle?: string,
    newCategoryId?: string | number,
    newTaskTime?: string,
    newDuration?: number,
    newCarryOverLookbackDays?: number,
    newStartMonth?: number,
    newEndMonth?: number
  ): Promise<boolean> => {
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
        const updates: Record<string, unknown> = {}
        if (newTitle !== undefined) updates.title = newTitle
        if (newCategoryId !== undefined) updates.category_id = newCategoryId
        if (newTaskTime !== undefined) updates.task_time = newTaskTime
        if (newDuration !== undefined) updates.duration = newDuration
        if (newCarryOverLookbackDays !== undefined) {
          updates.carry_over_lookback_days = newCarryOverLookbackDays
        }

        await db.goal.update(String(goalId), updates)
      }

      const currentTitle = newTitle !== undefined ? newTitle : goalToUpdate.title
      const currentTiming = resolvePlanTiming(
        { task_time: newTaskTime, duration: newDuration },
        goalToUpdate
      )

      const existingGoalMonths = dataStore.getGoalMonthsByGoalId(String(goalId))
      const existingMonths = existingGoalMonths
        .map(mp => getDateOnlyMonth(mp.month))
        .filter((m): m is number => m !== null)

      const startM = newStartMonth !== undefined ? newStartMonth : (goalToUpdate.startMonth || 1)
      const endM = newEndMonth !== undefined ? newEndMonth : (goalToUpdate.endMonth || startM)
      const targetMonths: number[] = []
      for (let m = startM; m <= endM; m++) targetMonths.push(m)

      // 创建不存在的月度计划
      const createPromises: Promise<GoalMonth>[] = []
      for (const m of targetMonths) {
        if (!existingMonths.includes(m)) {
          const monthData: CreateGoalMonthPayload = {
            goal_id: String(goalId),
            user_id: authStore.userId!,
            title: currentTitle,
            description: goalToUpdate.description || '',
            month: `${year}-${String(m).padStart(2, '0')}-01`,
            status: 'active',
            priority: 2,
            task_time: currentTiming.task_time,
            duration: currentTiming.duration
          }
          createPromises.push(db.goalMonths.create(monthData))
        }
      }

      // 更新已有月度计划的标题和时间
      const updatePromises = existingGoalMonths
        .map(mp => {
          const payload: UpdateGoalMonthPayload = {} as UpdateGoalMonthPayload
          if (newTitle !== undefined) payload.title = newTitle
          if (newTaskTime !== undefined && !mp.task_time) payload.task_time = currentTiming.task_time
          if (newDuration !== undefined && !mp.duration) payload.duration = currentTiming.duration
          return Object.keys(payload).length > 0 ? db.goalMonths.update(mp.id, payload) : null
        })
        .filter((p): p is Promise<GoalMonth> => p !== null)

      // 删除不再需要的月度计划
      const toDelete = existingGoalMonths.filter(mp => {
        const m = getDateOnlyMonth(mp.month)
        return m !== null && !targetMonths.includes(m)
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

  /** 处理编辑弹窗的更新提交 */
  const handleUpdateGoal = async (updatedGoal: GoalFormData): Promise<void> => {
    if (!editingGoal.value || isSubmitting.value) return

    isSubmitting.value = true
    const success = await updateGoalData(
      editingGoal.value,
      updatedGoal.title,
      updatedGoal.category_id ?? undefined,
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

  /** 保存月度计划的详细信息（标题、时间等） */
  const saveMonthlyPlan = async (m: number, payload: UpdateGoalMonthPayload): Promise<void> => {
    const currentMp = dataStore.getGoalMonthsByGoalId(String(selectedGoal.value!.goal_id)).find(
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

  /** 新增目标：创建 goal 表记录 + 对应的月度计划 */
  const handleAddGoal = async (newGoal: GoalFormData): Promise<void> => {
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

      const createdPlan = await db.goal.create(planData as Parameters<typeof db.goal.create>[0])

      const promises: Promise<GoalMonth>[] = []
      for (let m = startM; m <= endM; m++) {
        const monthlyPlanData: CreateGoalMonthPayload = {
          goal_id: String(createdPlan.id),
          user_id: authStore.userId!,
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
      await loadGoalMonths(String(createdPlan.id))
      await fetchData()
      showAddModal.value = false
    } catch (e) {
      console.error('Add goal failed:', e)
    } finally {
      isSubmitting.value = false
    }
  }

  /** 删除目标：先删关联的月度计划，再删 goal 记录 */
  const handleDeleteGoal = async (): Promise<void> => {
    if (!editingGoal.value || isSubmitting.value) return

    isSubmitting.value = true
    try {
      const goalId = editingGoal.value.goal_id
      if (!goalId) return

      const relatedGoalMonths = dataStore.getGoalMonthsByGoalId(String(goalId))

      // 靠数据库级联删除，只需删 goalMonths
      await Promise.all(relatedGoalMonths.map(mp => db.goalMonths.delete(mp.id)))

      await db.goal.delete(String(goalId))

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

  /** 确认月份范围变更：更新目标的起止月份 */
  const handleConfirmRange = async ({ start, end }: DateRange): Promise<void> => {
    if (!selectedGoal.value) return

    const goalToUpdate: GoalWithMeta = {
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
    goalMonthsMap: batchStore.goalMonthsMap,

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
