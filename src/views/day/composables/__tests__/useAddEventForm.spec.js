import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'

vi.mock('@/services/database', () => ({
  db: {
    tasks: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    habits: { update: vi.fn(), delete: vi.fn() }
  }
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ userId: 'user-1' }))
}))

vi.mock('@/stores/dateStore', () => ({
  useDateStore: vi.fn(() => ({ currentDate: new Date(2026, 4, 8) }))
}))

vi.mock('@/views/day/composables/useDayData', () => ({
  useDayData: vi.fn(() => ({ fetchTasks: vi.fn() }))
}))

vi.mock('@/views/day/composables/useActionFeedback', () => ({
  useActionFeedback: vi.fn(() => ({ success: vi.fn(), error: vi.fn() }))
}))

import { useAddEventForm } from '@/views/day/composables/useAddEventForm'

describe('useAddEventForm', () => {
  it('打开新增弹窗时先隐藏标题错误，字段触碰后再显示', () => {
    const props = reactive({ show: true, initialData: null })
    const emit = vi.fn()

    const { errors, isValid, touchField } = useAddEventForm(props, emit)

    expect(isValid.value).toBe(false)
    expect(errors.value.title).toBe('')

    touchField('title')

    expect(errors.value.title).toBe('任务名称不能为空')
  })
})
