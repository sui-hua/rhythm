import { defineStore } from 'pinia'
import { reactive } from 'vue'

const buildInitialState = () => ({
  day: { showAddDrawer: false, editingTaskIndex: null },
  summary: { isCreating: false },
  direction: { showCategoryModal: false }
})

export const usePageStateStore = defineStore('pageState', () => {
  const state = reactive(buildInitialState())

  function resetAll() {
    Object.assign(state.day, buildInitialState().day)
    Object.assign(state.summary, buildInitialState().summary)
    Object.assign(state.direction, buildInitialState().direction)
  }

  return {
    ...state,
    resetAll
  }
})
