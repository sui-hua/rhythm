// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EditHabitModal from '../EditHabitModal.vue'

// mock db 服务
vi.mock('@/services/database', () => ({
  db: {
    habit: {
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({})
    }
  }
}))

// mock withLoadingLock，直接执行回调
vi.mock('@/utils/throttle', () => ({
  withLoadingLock: (fn: any) => fn
}))

// mock habitFrequency 工具函数
vi.mock('@/views/habits/utils/habitFrequency', () => ({
  createDefaultHabitFrequency: () => ({ type: 'daily', weekdays: [], monthDays: [] }),
  normalizeHabitFrequency: (freq: any) => freq
}))

// mock useHabitFrequencyForm
vi.mock('@/views/habits/composables/useHabitFrequencyForm', () => ({
  useHabitFrequencyForm: () => ({
    WEEKDAY_OPTIONS: [
      { label: '一', value: 1 },
      { label: '二', value: 2 }
    ],
    MONTH_DAY_OPTIONS: [1, 2, 3],
    canSubmitFrequency: { value: true },
    toggleWeekday: vi.fn(),
    toggleMonthDay: vi.fn(),
    buildFrequencyPayload: () => ({ type: 'daily', weekdays: [], monthDays: [] })
  })
}))

// stub Dialog 和其他子组件
const stubs = {
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
  Input: {
    template: '<input />',
    props: ['modelValue', 'placeholder', 'disabled', 'class'],
    emits: ['update:modelValue', 'blur', 'keyup']
  },
  Button: { template: '<button><slot /></button>', props: ['variant', 'disabled', 'class', 'type', 'title'] },
  TimePicker: { template: '<div />', props: ['modelValue', 'label', 'id'] },
  DurationPicker: { template: '<div />', props: ['modelValue', 'label', 'id'] }
}

describe('EditHabitModal', () => {
  const mockHabit = {
    id: 'habit-1',
    title: '每日阅读',
    task_time: '08:00',
    duration: 30,
    frequency: JSON.stringify({ type: 'daily', weekdays: [], monthDays: [] }),
    is_archived: false
  }

  it('显示"修改习惯"标题', () => {
    const wrapper = mount(EditHabitModal, {
      props: { show: true, habitData: mockHabit },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('修改习惯')
  })

  it('显示习惯名称标签', () => {
    const wrapper = mount(EditHabitModal, {
      props: { show: true, habitData: mockHabit },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('习惯名称')
  })

  it('显示保存修改按钮', () => {
    const wrapper = mount(EditHabitModal, {
      props: { show: true, habitData: mockHabit },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('保存修改')
  })

  it('未归档时显示"归档该习惯"按钮', () => {
    const wrapper = mount(EditHabitModal, {
      props: { show: true, habitData: mockHabit },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('归档该习惯')
  })

  it('已归档时显示"取消归档"按钮', () => {
    const archivedHabit = { ...mockHabit, is_archived: true }
    const wrapper = mount(EditHabitModal, {
      props: { show: true, habitData: archivedHabit },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('取消归档')
  })

  it('显示"删除该习惯"按钮', () => {
    const wrapper = mount(EditHabitModal, {
      props: { show: true, habitData: mockHabit },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('删除该习惯')
  })

  it('点击取消按钮触发 update:show 事件', async () => {
    const wrapper = mount(EditHabitModal, {
      props: { show: true, habitData: mockHabit },
      global: { stubs }
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text() === '取消')
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('update:show')).toBeTruthy()
    expect(wrapper.emitted('update:show')![0]).toEqual([false])
  })

  it('显示重复方式选项', () => {
    const wrapper = mount(EditHabitModal, {
      props: { show: true, habitData: mockHabit },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('每日')
    expect(wrapper.text()).toContain('每周')
    expect(wrapper.text()).toContain('每月')
  })
})
