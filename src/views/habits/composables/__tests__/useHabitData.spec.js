import { describe, expect, it, vi } from 'vitest'
import { buildPatchedHabit } from '@/views/habits/composables/useHabitData'

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
    const habit = { id: 'h1', title: 'Read', logs: [], monthlyLogs: [], completedDays: [], total: 0 }
    const newLog = { habit_id: 'h1', completed_at: '2026-04-20T08:00:00.000Z' }
    const viewContext = { year: 2026, month: 3 }

    const patched = buildPatchedHabit(habit, newLog, viewContext)

    expect(patched.total).toBe(1)
    expect(patched.completedDays).toContain(20)
  })

  it('returns original habit when newLog is null', () => {
    const habit = { id: 'h1', title: 'Read', logs: [], monthlyLogs: [], completedDays: [10], total: 1 }
    const patched = buildPatchedHabit(habit, null, { year: 2026, month: 3 })

    expect(patched.total).toBe(1)
    expect(patched.completedDays).toContain(10)
  })
})
