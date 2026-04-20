/**
 * @file useDirectionSelection.js
 * @description Direction 模块中的选择状态管理 Composable
 *
 * 本文件负责处理 Direction（方向/目标管理）模块中的用户选择行为，包括：
 * - 月份选择状态管理
 * - 日期范围选择（支持鼠标拖拽批量选择）
 * - 按星期类型过滤选择（只能同时选择有任务日或无任务日）
 * - 目标切换与选择
 *
 * @module Direction/Composables
 */

import { computed } from 'vue'
import { getDateOnlyDay, getDateOnlyMonth, getDateOnlyYear } from '@/views/direction/utils/dateOnly'
import { useDirectionState } from '@/views/direction/composables/useDirectionState'

/**
 * Direction 模块选择状态管理 Composable
 *
 * 提供日期选择、月份切换、目标选择等交互逻辑，与 useDirectionState 共享状态。
 * 支持拖拽批量选择同一类型日期（有任务日 / 无任务日不能混合选择）。
 *
 * @returns {Object} 包含选择状态与操作方法的对象
 */
export function useDirectionSelection() {
  /**
   * 从 useDirectionState 获取全局状态
   * - selectedGoal: 当前选中的目标计划
   * - selectedMonth: 当前选中的月份
   * - selectedDates: 各月份的已选日期映射 { month: [day1, day2, ...] }
   * - dailyTasks: 每日任务缓存
   * - isSelecting: 是否正在拖拽选择
   * - activePicker: 当前活跃的日期选择器阶段
   * - monthlyPlansCache: 月度计划缓存
   * - dailyPlansCache: 每日计划缓存
   * - archiveVersion: 归档版本号（用于触发响应式更新）
   */
  const {
    selectedGoal,
    selectedMonth,
    selectedDates,
    dailyTasks,
    isSelecting,
    activePicker,
    monthlyPlansCache,
    dailyPlansCache,
    archiveVersion
  } = useDirectionState()

  /**
   * 根据当前选中目标生成月度计划缓存的 key
   *
   * @param {number} m - 月份（1-12）
   * @returns {string} 格式为 `plan-{plan_id}-{month}` 或 `undefined-{month}`
   */
  const goalKey = (m) => {
    if (!selectedGoal.value) return `undefined-${m}`
    return `plan-${selectedGoal.value.plan_id}-${m}`
  }

  /**
   * 生成每日任务的唯一 key（用于 dailyTasks 缓存查找）
   *
   * @param {number} day - 日期
   * @returns {string} 格式为 `{goalKey}-{day}`
   */
  const dayTaskKey = (day) => `${goalKey(selectedMonth.value)}-${day}`

  /**
   * 判断指定月份的某一天是否已被选中
   *
   * @param {number} m - 月份（1-12）
   * @param {number} day - 日期
   * @returns {boolean}
   */
  const isSelected = (m, day) => selectedDates[m]?.includes(day)

  /**
   * 判断指定月份的某一天是否有任务
   *
   * @param {number} m - 月份（1-12）
   * @param {number} day - 日期
   * @returns {boolean} 有任务返回 true，否则 false
   */
  const hasTask = (m, day) => !!(dailyTasks[`${goalKey(m)}-${day}`]?.title)

  /**
   * 判断指定日期是否可以被加入当前选择
   *
   * 选择限制规则：同一批选择的日期必须同为「有任务日」或同为「无任务日」。
   * 例如已选中 3 号（有任务），则只能继续选择其他有任务的日期。
   *
   * @param {number} m - 月份（1-12）
   * @param {number} day - 日期
   * @returns {boolean} 可以选择返回 true
   */
  const canSelect = (m, day) => {
    const current = selectedDates[m]
    if (!current || current.length === 0) return true

    const firstDay = current[0]
    const targetType = hasTask(m, firstDay)
    const currentType = hasTask(m, day)

    return targetType === currentType
  }

  /**
   * 开始日期选择（鼠标按下时触发）
   *
   * 如果目标日期尚未选中且不符合选择规则（canSelect 返回 false），则忽略。
   * 否则切换该日期的选中状态（已选则取消，未选则选中）。
   *
   * @param {number} day - 被点击的日期
   * @returns {void}
   */
  const startSelection = (day) => {
    const m = selectedMonth.value

    const isCurrentlySelected = selectedDates[m]?.includes(day)
    if (!isCurrentlySelected && !canSelect(m, day)) return

    isSelecting.value = true
    if (!selectedDates[m]) selectedDates[m] = []

    const idx = selectedDates[m].indexOf(day)
    idx > -1 ? selectedDates[m].splice(idx, 1) : selectedDates[m].push(day)
  }

  /**
   * 处理鼠标进入日期格子（拖拽选择时触发）
   *
   * 仅在 isSelecting 为 true（正在拖拽）时生效，自动将经过的
   * 符合规则的日期加入选中列表。
   *
   * @param {number} day - 鼠标进入的日期
   * @returns {void}
   */
  const handleMouseEnter = (day) => {
    if (isSelecting.value) {
      const m = selectedMonth.value
      if (!canSelect(m, day)) return

      if (!selectedDates[m].includes(day)) selectedDates[m].push(day)
    }
  }

  /**
   * 结束拖拽选择状态
   *
   * @returns {void}
   */
  const endSelection = () => { isSelecting.value = false }

  /**
   * 取消当前月份的所有选中日期
   *
   * @returns {void}
   */
  const deselectAllInMonth = () => { selectedDates[selectedMonth.value] = [] }

  /**
   * 获取指定月份的偏移量（该月第一天是星期几），用于日历渲染时的空白填充
   *
   * @param {number} month - 月份（1-12）
   * @returns {number} 0=周日, 1=周一, ..., 6=周六
   */
  const getMonthOffset = (month) => {
    if (!selectedGoal.value) {
      return new Date(new Date().getFullYear(), month - 1, 1).getDay()
    }

    const cached = monthlyPlansCache[selectedGoal.value.plan_id] || []
    const mp = cached.find(item => getDateOnlyMonth(item.month) === month)
    if (!mp) {
      return new Date(new Date().getFullYear(), month - 1, 1).getDay()
    }

    const year = getDateOnlyYear(mp.month) || new Date().getFullYear()
    return new Date(year, month - 1, 1).getDay()
  }

  /**
   * 按星期索引选择该月所有对应的日期（全选/反选同一星期几的所有日期）
   *
   * 用于「全选周一」「全选周三」等快捷操作。
   * 如果当月所有该星期都已选中，则反选；否则全选。
   *
   * @param {number} month - 月份（1-12）
   * @param {number} weekIndex - 星期索引（0=周日, 1=周一, ..., 6=周六）
   * @returns {void}
   */
  const selectWeekDay = (month, weekIndex) => {
    const year = new Date().getFullYear()
    const daysInMonth = new Date(year, month, 0).getDate()

    const targetDays = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(year, month - 1, d).getDay()
      if (dayOfWeek === weekIndex) {
        targetDays.push(d)
      }
    }

    const currentSelection = selectedDates[month] || []
    const isAllSelected = targetDays.every(d => currentSelection.includes(d))

    let newSelection
    if (isAllSelected) {
      newSelection = currentSelection.filter(d => !targetDays.includes(d))
    } else {
      newSelection = [...new Set([...currentSelection, ...targetDays])]
    }

    selectedDates[month] = newSelection.sort((a, b) => a - b)
  }

  /**
   * 判断指定月份的所有选中日期是否都有任务
   *
   * 用于批量操作前检查选择是否有效。
   *
   * @param {number} month - 月份（1-12）
   * @returns {boolean} 所有选中日期都有任务返回 true，无选中或任一日期无任务返回 false
   */
  const isAllSelectedDatesHaveTask = (month) => {
    const dates = selectedDates[month] || []
    if (dates.length === 0) return false
    return dates.every(day => hasTask(month, day))
  }

  /**
   * 切换月份选中状态
   *
   * 如果再次点击同一月份则取消选中（selectedMonth 设为 null）。
   *
   * @param {number} m - 月份（1-12）
   * @returns {void}
   */
  const toggleMonth = (m) => {
    selectedMonth.value = selectedMonth.value === m ? null : m
    if (selectedMonth.value && !selectedDates[m]) selectedDates[m] = []
  }

  /**
   * 计算属性：当前选中月份中有任务的日期列表
   *
   * 响应式依赖 archiveVersion、selectedGoal、selectedMonth，
   * 返回排序后的日期数字数组。
   *
   * @returns {number[]} 有任务的日期列表（如 [1, 3, 5, 8]）
   */
  const datesWithTasks = computed(() => {
    archiveVersion.value
    const planId = selectedGoal.value?.plan_id
    if (!planId || selectedMonth.value == null) return []

    const monthlyPlansOfGoal = monthlyPlansCache[planId] || []
    const mp = monthlyPlansOfGoal.find(
      item => getDateOnlyMonth(item.month) === selectedMonth.value
    )
    if (!mp) return []

    return (dailyPlansCache[mp.id] || [])
      .filter(dp => dp.title)
      .map(dp => getDateOnlyDay(dp.day))
      .filter(day => day !== null)
      .sort((a, b) => a - b)
  })

  /**
   * 选中指定目标
   *
   * 切换目标时会重置 selectedMonth 和 activePicker 状态。
   *
   * @param {Object} g - 目标对象（需包含 plan_id）
   * @returns {void}
   */
  const selectGoal = (g) => {
    selectedGoal.value = g
    selectedMonth.value = null
    activePicker.value = 'start'
  }

  return {
    selectedGoal,
    selectedMonth,
    selectedDates,
    dailyTasks,
    datesWithTasks,
    goalKey,
    dayTaskKey,
    isSelected,
    hasTask,
    canSelect,
    startSelection,
    handleMouseEnter,
    endSelection,
    deselectAllInMonth,
    toggleMonth,
    selectGoal,
    getMonthOffset,
    selectWeekDay,
    isAllSelectedDatesHaveTask
  }
}
