import { create } from 'zustand'
import type { DayExecutionItem } from '@/domain/day/types'
import type { TaskRecord } from '@/domain/tasks/types'

type DayScreenState = {
  currentDate: Date
  editingTask: TaskRecord | null
  readonlyItem: DayExecutionItem | null
  isTaskEditorOpen: boolean
  isReadonlySheetOpen: boolean
  setCurrentDate: (date: Date) => void
  openNewTask: () => void
  openEditTask: (task: TaskRecord) => void
  closeTaskEditor: () => void
  openReadonlyItem: (item: DayExecutionItem) => void
  closeReadonlySheet: () => void
}

export const useDayScreenState = create<DayScreenState>((set) => ({
  currentDate: new Date(),
  editingTask: null,
  readonlyItem: null,
  isTaskEditorOpen: false,
  isReadonlySheetOpen: false,
  setCurrentDate: (date) => set({ currentDate: date }),
  openNewTask: () => set({ editingTask: null, isTaskEditorOpen: true }),
  openEditTask: (task) => set({ editingTask: task, isTaskEditorOpen: true }),
  closeTaskEditor: () => set({ editingTask: null, isTaskEditorOpen: false }),
  openReadonlyItem: (item) => set({ readonlyItem: item, isReadonlySheetOpen: true }),
  closeReadonlySheet: () => set({ readonlyItem: null, isReadonlySheetOpen: false })
}))