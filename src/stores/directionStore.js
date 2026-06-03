import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { getMonthName } from '@/utils/dateFormatter'

export const months = Array.from({ length: 12 }, (_, i) => ({
  label: getMonthName(i + 1, 'zh'),
  value: i + 1,
  full: getMonthName(i + 1, 'full')
}))

export const useDirectionStore = defineStore('direction', () => {
  // 数据状态
  const goals = ref([])
  const goalMonths = ref([])
  const goalMonthsCache = reactive({})
  const goalDaysCache = reactive({})
  const archiveVersion = ref(0)

  // 选择状态
  const selectedGoal = ref(null)
  const editingGoal = ref(null)
  const selectedMonth = ref(null)
  const activePicker = ref('start')
  const isSelecting = ref(false)

  // UI 状态
  const showAddModal = ref(false)
  const showCategoryModal = ref(false)

  // 批量编辑状态
  const goalMonthsMap = reactive({})
  const dailyTasks = reactive({})
  const selectedDates = reactive({})
  const batchInput = ref('')

  // 初始化状态
  const initialized = ref(false)

  // 分类数据
  const categories = ref([])

  // 辅助方法：按 goalId 获取缓存的月度计划
  const getGoalMonthsByGoalId = (goalId) => goalMonthsCache[goalId] || []

  // 清空日计划缓存（保留指定的 monthPlanId）
  const clearGoalDaysCache = (keepMonthPlanId = null) => {
    if (keepMonthPlanId && goalDaysCache[keepMonthPlanId]) {
      const keepData = goalDaysCache[keepMonthPlanId]
      Object.keys(goalDaysCache).forEach(key => {
        delete goalDaysCache[key]
      })
      goalDaysCache[keepMonthPlanId] = keepData
    } else {
      Object.keys(goalDaysCache).forEach(key => {
        delete goalDaysCache[key]
      })
    }
  }

  // 同步缓存到扁平兼容镜像
  const syncGoalMonthsToFlatList = (goalId) => {
    const cached = goalMonthsCache[goalId] || []
    const others = goalMonths.value.filter(item => item.goal_id !== goalId)
    goalMonths.value = [...others, ...cached]
  }

  // 重置所有状态
  const reset = () => {
    goals.value = []
    goalMonths.value = []
    editingGoal.value = null
    selectedGoal.value = null
    selectedMonth.value = null
    activePicker.value = 'start'
    isSelecting.value = false
    showAddModal.value = false
    showCategoryModal.value = false
    initialized.value = false
    categories.value = []

    Object.keys(goalMonthsCache).forEach(key => delete goalMonthsCache[key])
    Object.keys(goalDaysCache).forEach(key => delete goalDaysCache[key])
    Object.keys(goalMonthsMap).forEach(key => delete goalMonthsMap[key])
    Object.keys(dailyTasks).forEach(key => delete dailyTasks[key])
    Object.keys(selectedDates).forEach(key => delete selectedDates[key])
    batchInput.value = ''
    archiveVersion.value = 0
  }

  return {
    goals, goalMonths, goalMonthsCache, goalDaysCache, archiveVersion,
    selectedGoal, editingGoal, selectedMonth, activePicker, isSelecting,
    showAddModal, showCategoryModal,
    goalMonthsMap, dailyTasks, selectedDates, batchInput,
    initialized,
    categories,
    getGoalMonthsByGoalId, clearGoalDaysCache, syncGoalMonthsToFlatList, reset
  }
})
