/**
 * Page State Store
 *
 * Manages transient UI state for various views/pages in the application.
 * Each view has its own state namespace (day, summary, direction) containing
 * flags like drawers, modals, and editing states that don't need persistence.
 *
 * This store is NOT persisted - state resets on page refresh.
 */

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
