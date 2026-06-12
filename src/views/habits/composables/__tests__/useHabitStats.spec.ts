import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import type { AugmentedHabit } from '@/types/models'
import type { HabitLog } from '@/services/db/habit'

// mock dateStore
vi.mock('@/stores/dateStore', () => ({
  useDateStore: () => ({
    currentDate: new Date()
  })
}))

import { useHabitStats } from '../useHabitStats'

describe('useHabitStats', () => {
  // 创建 mock 习惯数据的辅助函数
  function createMockHabit(overrides: Partial<AugmentedHabit> = {}): AugmentedHabit {
    return {
      id: 'h1',
      title: '早起',
      frequency: { type: 'daily' },
      logs: [],
      monthlyLogs: [],
      completedDays: [],
      total: 0,
      completionRate: 0,
      streak: 0,
      ...overrides
    }
  }

  // todayCompletionRate：空列表返回 0
  it('todayCompletionRate 空习惯列表返回 0', () => {
    const habits = ref<AugmentedHabit[]>([])
    const selectedHabit = ref<AugmentedHabit | null>(null)
    const { todayCompletionRate } = useHabitStats(habits, selectedHabit)
    expect(todayCompletionRate.value).toBe(0)
  })

  // todayCompletionRate：今日无打卡返回 0%
  it('todayCompletionRate 今日无打卡返回 0', () => {
    const habits = ref<AugmentedHabit[]>([
      createMockHabit({ logs: [] }),
      createMockHabit({ id: 'h2', logs: [] })
    ])
    const selectedHabit = ref<AugmentedHabit | null>(null)
    const { todayCompletionRate } = useHabitStats(habits, selectedHabit)
    expect(todayCompletionRate.value).toBe(0)
  })

  // todayCompletionRate：全部打卡返回 100%
  it('todayCompletionRate 全部打卡返回 100', () => {
    const now = new Date()
    const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString()
    const todayLog = (habitId: string): HabitLog => ({ id: `log-${habitId}`, habit_id: habitId, completed_at: todayISO })
    const habits = ref<AugmentedHabit[]>([
      createMockHabit({ logs: [todayLog('h1')] }),
      createMockHabit({ id: 'h2', logs: [todayLog('h2')] })
    ])
    const selectedHabit = ref<AugmentedHabit | null>(null)
    const { todayCompletionRate } = useHabitStats(habits, selectedHabit)
    expect(todayCompletionRate.value).toBe(100)
  })

  // todayCompletionRate：部分打卡返回对应百分比
  it('todayCompletionRate 部分打卡返回正确百分比', () => {
    const now = new Date()
    const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0).toISOString()
    const todayLog: HabitLog = { id: 'log-h1', habit_id: 'h1', completed_at: todayISO }
    const habits = ref<AugmentedHabit[]>([
      createMockHabit({ logs: [todayLog] }),
      createMockHabit({ id: 'h2', logs: [] })
    ])
    const selectedHabit = ref<AugmentedHabit | null>(null)
    const { todayCompletionRate } = useHabitStats(habits, selectedHabit)
    expect(todayCompletionRate.value).toBe(50)
  })

  // habitStats：未选中习惯时返回空数组
  it('habitStats 未选中习惯时返回空数组', () => {
    const habits = ref<AugmentedHabit[]>([])
    const selectedHabit = ref<AugmentedHabit | null>(null)
    const { habitStats } = useHabitStats(habits, selectedHabit)
    expect(habitStats.value).toEqual([])
  })

  // habitStats：选中习惯时返回四项指标
  it('habitStats 选中习惯时返回四项统计指标', () => {
    const habits = ref<AugmentedHabit[]>([])
    const selectedHabit = ref<AugmentedHabit | null>(
      createMockHabit({
        completedDays: [1, 3, 5],
        total: 30,
        completionRate: 80,
        streak: 5
      })
    )
    const { habitStats } = useHabitStats(habits, selectedHabit)
    const stats = habitStats.value
    expect(stats).toHaveLength(4)
    expect(stats[0]).toEqual({ label: '本月打卡', value: 3, unit: '天' })
    expect(stats[1]).toEqual({ label: '年度总计', value: 30, unit: '天' })
    expect(stats[2]).toEqual({ label: '周期完成率', value: 80, unit: '%' })
    expect(stats[3]).toEqual({ label: '当前连击', value: 5, unit: '天' })
  })
})
