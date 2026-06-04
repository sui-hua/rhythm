// 瞬态 UI 状态，不持久化，刷新页面后重置
import { defineStore } from 'pinia'
import { reactive } from 'vue'

/** 页面状态结构定义 */
interface DayPageState {
  showAddDrawer: boolean
  editingTaskIndex: number | null
}

interface SummaryPageState {
  isCreating: boolean
}

interface DirectionPageState {
  showCategoryModal: boolean
  showAddModal: boolean
}

interface PageState {
  day: DayPageState
  summary: SummaryPageState
  direction: DirectionPageState
}

// 构建初始状态工厂函数
const buildInitialState = (): PageState => ({
  day: { showAddDrawer: false, editingTaskIndex: null },
  summary: { isCreating: false },
  direction: { showCategoryModal: false, showAddModal: false }
})

export const usePageStateStore = defineStore('pageState', () => {
  const state = reactive<PageState>(buildInitialState())

  // 重置所有页面状态到初始值
  function resetAll(): void {
    Object.assign(state.day, buildInitialState().day)
    Object.assign(state.summary, buildInitialState().summary)
    Object.assign(state.direction, buildInitialState().direction)
  }

  return {
    state,
    resetAll
  }
})
