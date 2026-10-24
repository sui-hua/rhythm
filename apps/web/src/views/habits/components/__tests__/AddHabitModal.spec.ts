// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AddHabitModal from '../AddHabitModal.vue'
import { db } from '@/services/database'
import type { Habit } from '@/services/db/habit'

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
  withLoadingLock: <Args extends unknown[], Result>(fn: (...args: Args) => Promise<Result>) => fn
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
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'disabled', 'class'],
    emits: ['update:modelValue', 'blur', 'keyup']
  },
  Button: { template: '<button :disabled="disabled"><slot /></button>', props: ['variant', 'disabled', 'class', 'type'] },
  TimePicker: { template: '<div />', props: ['modelValue', 'label', 'id'] },
  DurationPicker: { template: '<div />', props: ['modelValue', 'label', 'id'] }
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })

  return { promise, resolve }
}

describe('AddHabitModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.habit.create).mockResolvedValue({ id: 'new-habit-1', title: '每日阅读' } satisfies Habit)
  })

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

  it('创建 pending 时重复点击只创建一次', async () => {
    const gate = deferred<Habit>()
    vi.mocked(db.habit.create).mockReturnValue(gate.promise)
    const wrapper = mount(AddHabitModal, {
      props: { show: true },
      global: { stubs }
    })
    await wrapper.find('input').setValue('每日阅读')

    const createBtn = wrapper.findAll('button').find(b => b.text() === '确认创建')!
    const first = createBtn.trigger('click')
    const second = createBtn.trigger('click')
    await nextTick()

    expect(db.habit.create).toHaveBeenCalledTimes(1)
    expect(createBtn.attributes('disabled')).toBeDefined()

    gate.resolve({ id: 'new-habit-1', title: '每日阅读' })
    await first
    await second
  })
})
