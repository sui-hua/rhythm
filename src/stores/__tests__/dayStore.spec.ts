import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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
  toGoalDayStatus: vi.fn((completed: boolean) => (completed ? 'completed' : 'pending'))
}))

vi.mock('@/views/day/composables/useDayExecutionItems', () => ({
  buildDayExecutionItems: vi.fn(() => [])
}))

vi.mock('@/views/habits/utils/habitFrequency', () => ({
  matchesHabitFrequency: vi.fn(() => true)
}))

import { useDayStore } from '@/stores/dayStore'
import { useDateStore } from '@/stores/dateStore'
import { db } from '@/services/database'

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

  it('isLoading 在 fetchTasks 期间为 true', async () => {
    let resolveList: (v: any) => void
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
