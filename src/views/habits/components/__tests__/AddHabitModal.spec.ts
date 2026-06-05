// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AddHabitModal from '../AddHabitModal.vue'

// mock db 服务
vi.mock('@/services/database', () => ({
  db: {
    habit: {
      create: vi.fn().mockResolvedValue({ id: 'new-habit-1' })
    }
  }
}))

// mock authStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ userId: 'user-1' })
}))

// mock withLoadingLock，直接执行回调
vi.mock('@/utils/throttle', () => ({
  withLoadingLock: (fn: any) => fn
}))

// mock useHabitFrequencyForm
vi.mock('@/views/habits/composables/useHabitFrequencyForm', () => ({
  useHabitFrequencyForm: () => ({
    WEEKDAY_OPTIONS: [
      { label: '一', value: 1 },
      { label: '二', value: 2 },
      { label: '三', value: 3 }
    ],
    MONTH_DAY_OPTIONS: [1, 2, 3, 4, 5],
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
  DialogDescription: { template: '<div><slot /></div>' },
  Input: {
    template: '<input />',
    props: ['modelValue', 'placeholder', 'disabled', 'class'],
    emits: ['update:modelValue', 'blur', 'keyup']
  },
  Button: { template: '<button><slot /></button>', props: ['variant', 'disabled', 'class', 'type'] },
  TimePicker: { template: '<div />', props: ['modelValue', 'label', 'id'] },
  DurationPicker: { template: '<div />', props: ['modelValue', 'label', 'id'] }
}

describe('AddHabitModal', () => {
  it('显示"添加新习惯"标题', () => {
    const wrapper = mount(AddHabitModal, {
      props: { show: true },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('添加新习惯')
  })

  it('显示习惯名称输入标签', () => {
    const wrapper = mount(AddHabitModal, {
      props: { show: true },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('习惯名称')
  })

  it('显示重复方式选项', () => {
    const wrapper = mount(AddHabitModal, {
      props: { show: true },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('每日')
    expect(wrapper.text()).toContain('每周')
    expect(wrapper.text()).toContain('每月')
  })

  it('显示确认创建按钮', () => {
    const wrapper = mount(AddHabitModal, {
      props: { show: true },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('确认创建')
  })

  it('显示取消按钮', () => {
    const wrapper = mount(AddHabitModal, {
      props: { show: true },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('取消')
  })

  it('点击取消按钮触发 update:show 事件', async () => {
    const wrapper = mount(AddHabitModal, {
      props: { show: true },
      global: { stubs }
    })
    const cancelBtn = wrapper.findAll('button').find(b => b.text() === '取消')
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('update:show')).toBeTruthy()
    expect(wrapper.emitted('update:show')![0]).toEqual([false])
  })
})
