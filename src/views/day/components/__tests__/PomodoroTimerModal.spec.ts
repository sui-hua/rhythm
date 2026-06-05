// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import PomodoroTimerModal from '../PomodoroTimerModal.vue'

// 创建可控的 pomodoroStore mock 状态
const mockPomodoroState = reactive({
  showModal: true,
  activeTask: {
    id: 'task-1',
    title: '写代码',
    completed: false,
    original: { start_time: '2026-06-05T09:00:00', end_time: '2026-06-05T09:30:00' },
    actual_start_time: '2026-06-05T09:00:00',
    actual_end_time: null
  },
  formattedTime: '15:30',
  elapsedSeconds: 930,
  reset: vi.fn()
})

vi.mock('@/stores/pomodoroStore', () => ({
  usePomodoroStore: () => mockPomodoroState
}))

vi.mock('@/stores/dayStore', () => ({
  useDayStore: () => ({
    handleToggleComplete: vi.fn()
  })
}))

// stub Dialog 和 Button 组件
const stubs = {
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  Button: { template: '<button><slot /></button>', props: ['variant', 'class'] }
}

describe('PomodoroTimerModal', () => {
  beforeEach(() => {
    mockPomodoroState.showModal = true
    mockPomodoroState.activeTask = {
      id: 'task-1',
      title: '写代码',
      completed: false,
      original: { start_time: '2026-06-05T09:00:00', end_time: '2026-06-05T09:30:00' },
      actual_start_time: '2026-06-05T09:00:00',
      actual_end_time: null
    }
    mockPomodoroState.formattedTime = '15:30'
    mockPomodoroState.elapsedSeconds = 930
  })

  it('显示格式化时间', () => {
    const wrapper = mount(PomodoroTimerModal, { global: { stubs } })
    expect(wrapper.text()).toContain('15:30')
  })

  it('显示任务标题', () => {
    const wrapper = mount(PomodoroTimerModal, { global: { stubs } })
    expect(wrapper.text()).toContain('写代码')
  })

  it('显示"专注模式中"状态标签', () => {
    const wrapper = mount(PomodoroTimerModal, { global: { stubs } })
    expect(wrapper.text()).toContain('专注模式中')
  })

  it('显示"完成并记录"按钮', () => {
    const wrapper = mount(PomodoroTimerModal, { global: { stubs } })
    expect(wrapper.text()).toContain('完成并记录')
  })

  it('showModal=false 时组件仍然挂载（Dialog 内部控制显隐）', () => {
    mockPomodoroState.showModal = false
    const wrapper = mount(PomodoroTimerModal, { global: { stubs } })
    expect(wrapper.exists()).toBe(true)
  })

  it('点击完成按钮调用 handleComplete', async () => {
    const wrapper = mount(PomodoroTimerModal, { global: { stubs } })
    const btn = wrapper.findAll('button').find(b => b.text().includes('完成并记录'))
    await btn?.trigger('click')
    // handleComplete 内部会调用 dayStore.handleToggleComplete 和 store.reset
    expect(mockPomodoroState.reset).toHaveBeenCalled()
  })
})
