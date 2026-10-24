import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// mock database 模块
vi.mock('@/services/database', () => ({
  db: {
    habit: {
      list: vi.fn()
    }
  }
}))

import { useHabitStore } from '@/stores/habitStore'
import { db } from '@/services/database'
import type { Habit } from '@/services/db/habit'

const mockDbHabitList = vi.mocked(db.habit.list)

describe('habitStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchHabits 调用 db.habit.list', async () => {
    const habits: Habit[] = [
      { id: 'h-1', title: '早起', is_archived: false },
      { id: 'h-2', title: '阅读', is_archived: true }
    ]
    mockDbHabitList.mockResolvedValue(habits)

    const store = useHabitStore()
    await store.fetchHabits()

    expect(mockDbHabitList).toHaveBeenCalledTimes(1)
    expect(store.allHabits).toHaveLength(2)
  })

  it('habits 计算属性过滤 is_archived', async () => {
    const habits: Habit[] = [
      { id: 'h-1', title: '早起', is_archived: false },
      { id: 'h-2', title: '阅读', is_archived: true },
      { id: 'h-3', title: '运动', is_archived: false }
    ]
    mockDbHabitList.mockResolvedValue(habits)

    const store = useHabitStore()
    await store.fetchHabits()

    expect(store.habits).toHaveLength(2)
    expect(store.habits.map(h => h.id)).toEqual(['h-1', 'h-3'])

    expect(store.archivedHabits).toHaveLength(1)
    expect(store.archivedHabits[0].id).toBe('h-2')
  })

  it('fetchHabits 失败时 loading 恢复为 false', async () => {
    mockDbHabitList.mockRejectedValue(new Error('网络错误'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const store = useHabitStore()
    await store.fetchHabits()

    expect(store.loading).toBe(false)
    expect(store.allHabits).toEqual([])
    consoleSpy.mockRestore()
  })
})
