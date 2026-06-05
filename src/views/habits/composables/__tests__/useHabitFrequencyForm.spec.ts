import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'

// mock habitFrequency 工具函数
vi.mock('@/views/habits/utils/habitFrequency', () => ({
  createDefaultHabitFrequency: vi.fn(() => ({ type: 'daily' })),
  normalizeHabitFrequency: vi.fn((freq: any) => {
    if (freq.type === 'weekly') return { type: 'weekly', weekdays: [...freq.weekdays].sort((a: number, b: number) => a - b) }
    if (freq.type === 'monthly') return { type: 'monthly', monthDays: [...freq.monthDays].sort((a: number, b: number) => a - b) }
    return { type: 'daily' }
  })
}))

import { useHabitFrequencyForm, WEEKDAY_OPTIONS, MONTH_DAY_OPTIONS } from '../useHabitFrequencyForm'

describe('useHabitFrequencyForm', () => {
  // 导出常量验证
  it('WEEKDAY_OPTIONS 包含 7 个选项', () => {
    expect(WEEKDAY_OPTIONS).toHaveLength(7)
    expect(WEEKDAY_OPTIONS[0]).toEqual({ label: '一', value: 1 })
    expect(WEEKDAY_OPTIONS[6]).toEqual({ label: '日', value: 7 })
  })

  it('MONTH_DAY_OPTIONS 包含 1-31', () => {
    expect(MONTH_DAY_OPTIONS).toHaveLength(31)
    expect(MONTH_DAY_OPTIONS[0]).toBe(1)
    expect(MONTH_DAY_OPTIONS[30]).toBe(31)
  })

  // canSubmitFrequency：daily 类型始终可提交
  it('canSubmitFrequency daily 类型始终为 true', () => {
    const form = reactive({ frequencyType: 'daily' as const, weekdays: [], monthDays: [] })
    const { canSubmitFrequency } = useHabitFrequencyForm(form)
    expect(canSubmitFrequency.value).toBe(true)
  })

  // canSubmitFrequency：weekly 无选中时不可提交
  it('canSubmitFrequency weekly 无选中 weekday 时为 false', () => {
    const form = reactive({ frequencyType: 'weekly' as const, weekdays: [], monthDays: [] })
    const { canSubmitFrequency } = useHabitFrequencyForm(form)
    expect(canSubmitFrequency.value).toBe(false)
  })

  // canSubmitFrequency：weekly 有选中时可提交
  it('canSubmitFrequency weekly 有选中 weekday 时为 true', () => {
    const form = reactive({ frequencyType: 'weekly' as const, weekdays: [1, 3], monthDays: [] })
    const { canSubmitFrequency } = useHabitFrequencyForm(form)
    expect(canSubmitFrequency.value).toBe(true)
  })

  // canSubmitFrequency：monthly 无选中时不可提交
  it('canSubmitFrequency monthly 无选中 monthDay 时为 false', () => {
    const form = reactive({ frequencyType: 'monthly' as const, weekdays: [], monthDays: [] })
    const { canSubmitFrequency } = useHabitFrequencyForm(form)
    expect(canSubmitFrequency.value).toBe(false)
  })

  // canSubmitFrequency：monthly 有选中时可提交
  it('canSubmitFrequency monthly 有选中 monthDay 时为 true', () => {
    const form = reactive({ frequencyType: 'monthly' as const, weekdays: [], monthDays: [1, 15] })
    const { canSubmitFrequency } = useHabitFrequencyForm(form)
    expect(canSubmitFrequency.value).toBe(true)
  })

  // toggleWeekday：添加星期
  it('toggleWeekday 添加未选中的星期并保持升序', () => {
    const form = reactive({ frequencyType: 'weekly' as const, weekdays: [1, 5], monthDays: [] })
    const { toggleWeekday } = useHabitFrequencyForm(form)
    toggleWeekday(3)
    expect(form.weekdays).toEqual([1, 3, 5])
  })

  // toggleWeekday：移除已选中的星期
  it('toggleWeekday 移除已选中的星期', () => {
    const form = reactive({ frequencyType: 'weekly' as const, weekdays: [1, 3, 5], monthDays: [] })
    const { toggleWeekday } = useHabitFrequencyForm(form)
    toggleWeekday(3)
    expect(form.weekdays).toEqual([1, 5])
  })

  // toggleMonthDay：添加月日
  it('toggleMonthDay 添加未选中的月日并保持升序', () => {
    const form = reactive({ frequencyType: 'monthly' as const, weekdays: [], monthDays: [1, 28] })
    const { toggleMonthDay } = useHabitFrequencyForm(form)
    toggleMonthDay(15)
    expect(form.monthDays).toEqual([1, 15, 28])
  })

  // toggleMonthDay：移除已选中的月日
  it('toggleMonthDay 移除已选中的月日', () => {
    const form = reactive({ frequencyType: 'monthly' as const, weekdays: [], monthDays: [1, 15, 28] })
    const { toggleMonthDay } = useHabitFrequencyForm(form)
    toggleMonthDay(15)
    expect(form.monthDays).toEqual([1, 28])
  })

  // buildFrequencyPayload：daily 类型返回默认频率
  it('buildFrequencyPayload daily 类型返回默认频率', () => {
    const form = reactive({ frequencyType: 'daily' as const, weekdays: [], monthDays: [] })
    const { buildFrequencyPayload } = useHabitFrequencyForm(form)
    expect(buildFrequencyPayload()).toEqual({ type: 'daily' })
  })

  // buildFrequencyPayload：weekly 类型返回带 weekdays 的频率
  it('buildFrequencyPayload weekly 类型返回标准化频率', () => {
    const form = reactive({ frequencyType: 'weekly' as const, weekdays: [3, 1], monthDays: [] })
    const { buildFrequencyPayload } = useHabitFrequencyForm(form)
    const result = buildFrequencyPayload()
    expect(result.type).toBe('weekly')
    if (result.type === 'weekly') {
      expect(result.weekdays).toEqual([1, 3])
    }
  })

  // buildFrequencyPayload：monthly 类型返回带 monthDays 的频率
  it('buildFrequencyPayload monthly 类型返回标准化频率', () => {
    const form = reactive({ frequencyType: 'monthly' as const, weekdays: [], monthDays: [28, 1] })
    const { buildFrequencyPayload } = useHabitFrequencyForm(form)
    const result = buildFrequencyPayload()
    expect(result.type).toBe('monthly')
    if (result.type === 'monthly') {
      expect(result.monthDays).toEqual([1, 28])
    }
  })
})
