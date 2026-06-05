import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

// mock dateOnly 工具函数
vi.mock('@/views/direction/utils/dateOnly', () => ({
  getDateOnlyDay: vi.fn((val: string) => {
    if (!val) return null
    return new Date(val).getDate()
  }),
  getDateOnlyMonth: vi.fn((val: string) => {
    if (!val) return null
    return new Date(val).getMonth() + 1
  }),
  getDateOnlyYear: vi.fn((val: string) => {
    if (!val) return null
    return new Date(val).getFullYear()
  })
}))

// mock stores
const mockSelectedGoal = ref<any>(null)
const mockSelectedMonth = ref<number | null>(null)
const mockIsSelecting = ref(false)
const mockActivePicker = ref('start')
const mockArchiveVersion = ref(0)

const mockGoalMonthsCache: Record<string, any[]> = {}
const mockGoalDaysCache: Record<string, any[]> = {}
const mockSelectedDates: Record<string, number[]> = {}
const mockDailyTasks: Record<string, any> = {}

vi.mock('@/stores/goalDataStore', () => ({
  useGoalDataStore: () => ({
    archiveVersion: mockArchiveVersion,
    goalMonthsCache: mockGoalMonthsCache,
    goalDaysCache: mockGoalDaysCache
  })
}))

vi.mock('@/stores/goalSelectionStore', () => ({
  useGoalSelectionStore: () => ({
    selectedGoal: mockSelectedGoal,
    selectedMonth: mockSelectedMonth,
    isSelecting: mockIsSelecting,
    activePicker: mockActivePicker
  })
}))

vi.mock('@/stores/goalBatchStore', () => ({
  useGoalBatchStore: () => ({
    selectedDates: mockSelectedDates,
    dailyTasks: mockDailyTasks
  })
}))

// storeToRefs 需要 mock，因为我们的 store 已经是 ref
vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia')
  return {
    ...actual,
    storeToRefs: (store: Record<string, any>) => {
      const refs: Record<string, any> = {}
      for (const [key, value] of Object.entries(store)) {
        refs[key] = value
      }
      return refs
    }
  }
})

import { useDirectionSelection } from '../useDirectionSelection'

describe('useDirectionSelection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockSelectedGoal.value = null
    mockSelectedMonth.value = null
    mockIsSelecting.value = false
    mockActivePicker.value = 'start'
    // 清空 mock 数据
    for (const key of Object.keys(mockSelectedDates)) delete mockSelectedDates[key]
    for (const key of Object.keys(mockDailyTasks)) delete mockDailyTasks[key]
    for (const key of Object.keys(mockGoalMonthsCache)) delete mockGoalMonthsCache[key]
    for (const key of Object.keys(mockGoalDaysCache)) delete mockGoalDaysCache[key]
  })

  // goalKey 格式：无选中目标时返回 undefined-{month}
  it('goalKey 无选中目标时返回 undefined-{month}', () => {
    const { goalKey } = useDirectionSelection()
    expect(goalKey(3)).toBe('undefined-3')
  })

  // goalKey 格式：有选中目标时返回 goal-{goal_id}-{month}
  it('goalKey 有选中目标时返回 goal-{goal_id}-{month}', () => {
    mockSelectedGoal.value = { goal_id: 'abc' }
    const { goalKey } = useDirectionSelection()
    expect(goalKey(3)).toBe('goal-abc-3')
  })

  // dayTaskKey 格式
  it('dayTaskKey 返回 goalKey(month)-{day} 格式', () => {
    mockSelectedGoal.value = { goal_id: 'abc' }
    mockSelectedMonth.value = 3
    const { dayTaskKey } = useDirectionSelection()
    expect(dayTaskKey(15)).toBe('goal-abc-3-15')
  })

  // isSelected：未选中时返回 false
  it('isSelected 未选中时返回 false', () => {
    const { isSelected } = useDirectionSelection()
    expect(isSelected(3, 15)).toBe(false)
  })

  // isSelected：已选中时返回 true
  it('isSelected 已选中时返回 true', () => {
    mockSelectedDates[3] = [15, 16]
    const { isSelected } = useDirectionSelection()
    expect(isSelected(3, 15)).toBe(true)
  })

  // hasTask：有任务标题时返回 true
  it('hasTask 有任务标题时返回 true', () => {
    mockSelectedGoal.value = { goal_id: 'g1' }
    mockDailyTasks['goal-g1-3-15'] = { title: '写代码', id: 'd1' }
    const { hasTask } = useDirectionSelection()
    expect(hasTask(3, 15)).toBe(true)
  })

  // hasTask：无任务时返回 false
  it('hasTask 无任务时返回 false', () => {
    mockSelectedGoal.value = { goal_id: 'g1' }
    const { hasTask } = useDirectionSelection()
    expect(hasTask(3, 15)).toBe(false)
  })

  // canSelect：空选集时返回 true
  it('canSelect 空选集时返回 true', () => {
    const { canSelect } = useDirectionSelection()
    expect(canSelect(3, 15)).toBe(true)
  })

  // startSelection：切换选中状态
  it('startSelection 切换日期选中状态', () => {
    mockSelectedMonth.value = 3
    const { startSelection, isSelected } = useDirectionSelection()
    startSelection(15)
    expect(isSelected(3, 15)).toBe(true)
    // 再次点击取消选中
    startSelection(15)
    expect(isSelected(3, 15)).toBe(false)
  })

  // selectWeekDay：选中指定星期几的所有日期
  it('selectWeekDay 选中指定星期几的所有日期', () => {
    const { selectWeekDay, isSelected } = useDirectionSelection()
    // 2026年6月1日是周一(dayOfWeek=1)
    selectWeekDay(6, 1) // 选中所有周一
    // 2026年6月的周一：1, 8, 15, 22, 29
    expect(isSelected(6, 1)).toBe(true)
    expect(isSelected(6, 8)).toBe(true)
    expect(isSelected(6, 15)).toBe(true)
  })
})
