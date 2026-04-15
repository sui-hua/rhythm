import { ref, reactive } from 'vue'
import { getMonthName } from '@/utils/dateFormatter'

// 月份常量定义（动态生成）
export const months = Array.from({ length: 12 }, (_, i) => ({
  label: getMonthName(i + 1, 'zh'),
  value: i + 1,
  full: getMonthName(i + 1, 'full')
}))

// 共享状态（单例）
export const plans = ref([])
export const monthlyPlans = ref([])

export const selectedGoal = ref(null)
export const editingGoal = ref(null)

export const selectedMonth = ref(null)
export const activePicker = ref('start')
export const isSelecting = ref(false)
export const showAddModal = ref(false)
export const showCategoryModal = ref(false)


export const monthlyMainGoals = reactive({})
export const dailyTasks = reactive({})
export const selectedDates = reactive({})
export const batchInput = ref('')

export const initialized = ref(false)
