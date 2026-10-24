import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockSetActiveTask = vi.hoisted(() => vi.fn())

// mock 所有外部依赖
vi.mock('@/services/database', () => ({
  db: {
    task: { list: vi.fn(), getById: vi.fn() },
    goalDays: { listForDayView: vi.fn() },
    habit: { list: vi.fn(), listLogsByDate: vi.fn() }
  }
}))

vi.mock('@/utils/dateFormatter', () => ({
  getMonthName: vi.fn((m: number) => `${m}月`)
}))

vi.mock('@/utils/audio', () => ({
  playSuccessSound: vi.fn()
}))

vi.mock('@/utils/goalDayStatus', () => ({
  toGoalDayStatus: vi.fn((completed: boolean) => (completed ? 'completed' : 'active'))
}))

vi.mock('@/utils/dayExecutionItems', () => ({
  buildDayExecutionItems: vi.fn(() => [])
}))

vi.mock('@/utils/habitFrequency', () => ({
  matchesHabitFrequency: vi.fn(() => true)
}))

vi.mock('@/stores/habitStore', () => ({
  useHabitStore: () => ({
    habits: [],
    loading: false,
    fetchHabits: vi.fn().mockResolvedValue(undefined)
  })
}))

vi.mock('@/stores/pomodoroStore', () => ({
  usePomodoroStore: () => ({
    activeTask: null,
    setActiveTask: mockSetActiveTask
  })
}))

vi.mock('@/composables/useDayActions', () => ({
  useDayActions: () => ({
    handleToggleComplete: vi.fn(),
    handleStartTask: vi.fn(),
    updateTaskTime: vi.fn(),
    carryOverUncompletedTasksTo: vi.fn(),
    fetchTaskUpdate: vi.fn()
  })
}))

import { useDayStore } from '@/stores/dayStore'
import { useDateStore } from '@/stores/dateStore'
import { db } from '@/services/database'
import type { Task } from '@/services/db/task'

const mockTaskList = vi.mocked(db.task.list)

describe('dayStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('routeDateContext 从 dateStore 派生年月日', () => {
    const dateStore = useDateStore()
    dateStore.setDate(new Date(2026, 5, 5))

    const dayStore = useDayStore()

    expect(dayStore.selectedDay).toBe(5)
  })

  it('routeDateContext 随 dateStore.currentDate 变化', () => {
    const dateStore = useDateStore()
    dateStore.setDate(new Date(2026, 5, 5))

    const dayStore = useDayStore()
    expect(dayStore.selectedDay).toBe(5)

    dateStore.setDate(new Date(2026, 5, 20))
    expect(dayStore.selectedDay).toBe(20)
  })

  it('fetchTasks 调用 db.task.list', async () => {
    mockTaskList.mockResolvedValue([])

    const dateStore = useDateStore()
    dateStore.setDate(new Date(2026, 5, 5))

    const dayStore = useDayStore()
    await dayStore.fetchTasks()

    expect(mockTaskList).toHaveBeenCalledTimes(1)
  })

  it('fetchTasks 不会根据未完成任务自动打开番茄钟', async () => {
    mockTaskList.mockResolvedValue([
      {
        id: 'task-1',
        title: '计划任务',
        start_time: '2026-06-05T09:00:00.000Z',
        end_time: '2026-06-05T10:00:00.000Z',
        completed: false,
        actual_start_time: null,
        actual_end_time: null
      } as Task
    ])

    const dateStore = useDateStore()
    dateStore.setDate(new Date(2026, 5, 5))

    const dayStore = useDayStore()
    await dayStore.fetchTasks()

    expect(mockSetActiveTask).not.toHaveBeenCalled()
  })

  it('isLoading 在 fetchTasks 期间为 true', async () => {
    let resolveList: (value: Task[]) => void
    mockTaskList.mockReturnValue(new Promise(r => { resolveList = r }))

    const dateStore = useDateStore()
    dateStore.setDate(new Date(2026, 5, 5))

    const dayStore = useDayStore()
    const fetchPromise = dayStore.fetchTasks()

    expect(dayStore.isLoading).toBe(true)

    resolveList!([])
    await fetchPromise

    expect(dayStore.isLoading).toBe(false)
  })
})
