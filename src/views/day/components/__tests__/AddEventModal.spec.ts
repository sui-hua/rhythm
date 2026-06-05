// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import AddEventModal from '../AddEventModal.vue'

// mock useAddEventForm composable，返回可控的表单状态
vi.mock('@/views/day/composables/useAddEventForm', () => ({
  useAddEventForm: () => ({
    eventForm: reactive({ title: '', time: '09:00', duration: 0.5, description: '', category: '工作' }),
    isHabit: ref(false),
    errors: reactive({ title: '' }),
    isValid: ref(true),
    submit: vi.fn(),
    handleDelete: vi.fn(),
    markFieldTouched: vi.fn()
  }),
  InitialEventData: {}
}))

// stub 子组件，避免级联依赖
const stubs = {
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  Input: { template: '<input />', props: ['modelValue', 'placeholder', 'disabled'] },
  Button: { template: '<button><slot /></button>', props: ['variant', 'disabled'] },
  TimePicker: { template: '<div />', props: ['modelValue', 'label', 'id'] },
  DurationPicker: { template: '<div />', props: ['modelValue', 'label', 'id'] }
}

describe('AddEventModal', () => {
  it('新增模式下显示"新增任务"标题', () => {
    const wrapper = mount(AddEventModal, {
      props: { show: true, initialData: null },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('新增任务')
  })

  it('显示任务名称输入标签', () => {
    const wrapper = mount(AddEventModal, {
      props: { show: true, initialData: null },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('任务名称')
  })

  it('显示确认创建按钮（新增模式）', () => {
    const wrapper = mount(AddEventModal, {
      props: { show: true, initialData: null },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('确认创建')
  })

  it('显示分类按钮列表', () => {
    const wrapper = mount(AddEventModal, {
      props: {
        show: true,
        initialData: null,
        categories: ['工作', '个人', '会议']
      },
      global: { stubs }
    })
    // 分类按钮通过 Button 组件渲染，包含分类名称
    const buttons = wrapper.findAll('button')
    const buttonTexts = buttons.map(b => b.text())
    expect(buttonTexts.some(t => t.includes('工作'))).toBe(true)
  })

  it('点击取消按钮触发 update:show 事件', async () => {
    const wrapper = mount(AddEventModal, {
      props: { show: true, initialData: null },
      global: { stubs }
    })
    // 找到"取消"按钮并点击
    const cancelBtn = wrapper.findAll('button').find(b => b.text() === '取消')
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('update:show')).toBeTruthy()
    expect(wrapper.emitted('update:show')![0]).toEqual([false])
  })

  it('非 isHabit 时显示任务描述相关区域', () => {
    const wrapper = mount(AddEventModal, {
      props: { show: true, initialData: null },
      global: { stubs }
    })
    // 非 isHabit 模式下应存在描述相关 label
    const labels = wrapper.findAll('label')
    const hasDescLabel = labels.some(l => l.text().includes('描述'))
    expect(hasDescLabel).toBe(true)
  })
})
