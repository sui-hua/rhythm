/**
 * Direction 模块共享类型定义。
 * 用于 composables 和 utils 之间的类型一致性。
 * 数据库实体类型从 services/db/ re-export，避免重复定义。
 */

import type { Ref, ComputedRef } from 'vue'
import type { Goal } from '@/services/db/goal'
import type { GoalMonth, UpdateGoalMonthPayload } from '@/services/db/goalMonths'
import type { GoalDay } from '@/services/db/goalDays'

// re-export 数据库实体类型，供 composables 统一引用
export type { Goal } from '@/services/db/goal'
export type { GoalMonth } from '@/services/db/goalMonths'
export type { GoalDay } from '@/services/db/goalDays'

/** 带元数据的 Goal（composable 内部使用，扩展了 goal_id、name 等字段） */
export interface GoalWithMeta extends Goal {
  goal_id: string | number
  name: string
  category_name: string
  startMonth?: number
  endMonth?: number
  task_time?: string
  duration?: number
  carry_over_lookback_days?: number
}

/** 分类分组后的目标 */
export interface CategorizedGoalGroup {
  category: string
  items: GoalWithMeta[]
}

/** 计划时间配置 */
export interface PlanTiming {
  task_time: string
  duration: number
}

/** 日期范围 */
export interface DateRange {
  start: number
  end: number
}

/** 目标表单数据（新增/编辑共用） */
export interface GoalFormData {
  title: string
  description?: string
  category_id?: string | number | null
  task_time?: string
  duration?: number
  carry_over_lookback_days?: number
  startMonth?: number
  endMonth?: number
}

/** useDirectionFetch 返回值接口 */
export interface DirectionFetchReturn {
  categorizedGoals: ComputedRef<CategorizedGoalGroup[]>
  fetchData: () => Promise<void>
  isPageLoading: Ref<boolean>
  loadGoals: () => Promise<void>
  loadGoalMonths: (goalId: string) => Promise<void>
  loadGoalDays: (monthPlanId: string, options?: { force?: boolean }) => Promise<void>
}

/** useDirectionBatch 返回值接口 */
export interface DirectionBatchReturn {
  batchInput: Ref<string>
  applyBatchTask: () => Promise<void>
  handleBatchDelete: () => Promise<void>
}

/** useDirectionGoals 返回值接口 */
export interface DirectionGoalsReturn {
  months: { label: string; value: number; full: string }[]
  selectedGoal: Ref<GoalWithMeta | null>
  editingGoal: Ref<GoalWithMeta | null>
  activePicker: Ref<string>
  showAddModal: Ref<boolean>
  showCategoryModal: Ref<boolean>
  goalMonthsMap: Record<string, GoalMonth>
  activeMonthRange: ComputedRef<number[]>
  handleAddClick: () => void
  handleEditGoal: (goal: GoalWithMeta) => Promise<void>
  handleAddGoal: (newGoal: GoalFormData) => Promise<void>
  handleUpdateGoal: (updatedGoal: GoalFormData) => Promise<void>
  handleDeleteGoal: () => Promise<void>
  handleConfirmRange: (range: DateRange) => Promise<void>
  saveMonthlyPlan: (month: number, payload: UpdateGoalMonthPayload) => Promise<void>
  isSubmitting: Ref<boolean>
}

/** useDirectionSelection 返回值接口 */
export interface DirectionSelectionReturn {
  selectedGoal: Ref<GoalWithMeta | null>
  selectedMonth: Ref<number | null>
  selectedDates: Record<number, number[]>
  dailyTasks: Record<string, GoalDay>
  datesWithTasks: ComputedRef<number[]>
  goalKey: (month: number) => string
  dayTaskKey: (day: number) => string
  isSelected: (month: number, day: number) => boolean
  hasTask: (month: number, day: number) => boolean
  canSelect: (month: number, day: number) => boolean
  startSelection: (day: number) => void
  handleMouseEnter: (day: number) => void
  endSelection: () => void
  deselectAllInMonth: () => void
  toggleMonth: (month: number) => void
  selectGoal: (goal: GoalWithMeta) => void
  getMonthOffset: (month: number) => number
  selectWeekDay: (month: number, weekIndex: number) => void
  isAllSelectedDatesHaveTask: (month: number) => boolean
}

/** useDirectionTasks 返回值接口 */
export interface DirectionTasksReturn {
  handleUpdateTask: (task: GoalDay, payload: Partial<GoalDay>) => Promise<void>
}

/** progress 工具函数参数 */
export interface MonthlyProgressParams {
  dailyTasks: Record<string, GoalDay>
  goalId: string | number | null | undefined
  month: number | null | undefined
  isGoalDayCompleted: (status: unknown) => boolean
}
