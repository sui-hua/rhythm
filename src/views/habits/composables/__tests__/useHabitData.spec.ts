import { describe, expect, it, vi } from 'vitest'
import { buildPatchedHabit } from '@/views/habits/composables/useHabitData'
import type { AugmentedHabit } from '@/types/models'
import type { HabitLog } from '@/services/db/habit'
import type { ViewContext } from '@/views/habits/composables/useHabitData'

// Mock database to prevent Supabase initialization
vi.mock('@/services/database', () => ({
  db: {
    habits: {
      list: vi.fn(),
      listLogsByHabit: vi.fn()
    }
  }
}))

describe('useHabitData helpers', () => {
  it('patches current habit logs locally after toggle complete', () => {
    // 构造 AugmentedHabit 类型的习惯对象
    const habit: AugmentedHabit = {
      id: 'h1',
      title: 'Read',
      logs: [],
      monthlyLogs: [],
      completedDays: [],
      total: 0
    } as AugmentedHabit

    // 构造 HabitLog 类型的打卡记录
    const newLog: HabitLog = {
      habit_id: 'h1',
      completed_at: '2026-04-20T08:00:00.000Z'
    } as HabitLog

    const viewContext: ViewContext = { year: 2026, month: 3 }

    const patched = buildPatchedHabit(habit, newLog, viewContext)

    expect(patched.total).toBe(1)
    expect(patched.completedDays).toContain(20)
  })

  it('returns original habit when newLog is null', () => {
    const habit: AugmentedHabit = {
      id: 'h1',
      title: 'Read',
      logs: [],
      monthlyLogs: [],
      completedDays: [10],
      total: 1
    } as AugmentedHabit

    const patched = buildPatchedHabit(habit, null, { year: 2026, month: 3 })

    expect(patched.total).toBe(1)
    expect(patched.completedDays).toContain(10)
  })
})
