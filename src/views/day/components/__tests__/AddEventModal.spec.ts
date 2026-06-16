// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, reactive } from 'vue'
import AddEventModal from '../AddEventModal.vue'
import { TASK_CATEGORY_STORAGE_KEY } from '@/views/day/composables/useTaskCategories'

const mockIsSubmitting = ref(false)

// mock useAddEventForm composable，返回可控的表单状态
vi.mock('@/views/day/composables/useAddEventForm', () => ({
  useAddEventForm: () => ({
    eventForm: reactive({ title: '', time: '09:00', duration: 0.5, description: '', category: '工作' }),
    isHabit: ref(false),
    errors: reactive({ title: '' }),
    isValid: ref(true),
    submit: vi.fn(),
    handleDelete: vi.fn(),
    isSubmitting: mockIsSubmitting,
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
  Input: {
    template: '<input :value="modelValue" :placeholder="placeholder" :disabled="disabled" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'disabled'],
    emits: ['update:modelValue']
  },
  Button: { template: '<button :disabled="disabled"><slot /></button>', props: ['variant', 'disabled', 'size'] },
  TimePicker: { template: '<div />', props: ['modelValue', 'label', 'id'] },
  DurationPicker: { template: '<div />', props: ['modelValue', 'label', 'id'] }
}

describe('AddEventModal', () => {
  beforeEach(() => {
    mockIsSubmitting.value = false
    localStorage.removeItem(TASK_CATEGORY_STORAGE_KEY)
  })

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

  it('显示分类管理入口', () => {
    const wrapper = mount(AddEventModal, {
      props: { show: true, initialData: null },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('管理')
  })

  it('分类管理中可以新增分类', async () => {
    const wrapper = mount(AddEventModal, {
      props: { show: true, initialData: null, categories: ['工作'] },
      global: { stubs }
    })

    const manageBtn = wrapper.findAll('button').find(b => b.text() === '管理')
    await manageBtn?.trigger('click')

    const input = wrapper.find('input[placeholder="输入新分类"]')
    await input.setValue('学习')
    const addBtn = wrapper.findAll('button').find(b => b.text().includes('添加'))
    await addBtn?.trigger('click')

    expect(wrapper.text()).toContain('学习')
    expect(JSON.parse(localStorage.getItem(TASK_CATEGORY_STORAGE_KEY) || '[]')).toEqual(['工作', '学习'])
  })

  it('分类管理中可以删除分类', async () => {
    const wrapper = mount(AddEventModal, {
      props: { show: true, initialData: null, categories: ['工作', '学习'] },
      global: { stubs }
    })

    const manageBtn = wrapper.findAll('button').find(b => b.text() === '管理')
    await manageBtn?.trigger('click')

    const deleteBtn = wrapper.find('[aria-label="删除分类 学习"]')
    await deleteBtn.trigger('click')

    expect(wrapper.text()).not.toContain('学习')
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

  it('提交中禁用保存和删除按钮，防止重复点击', () => {
    mockIsSubmitting.value = true

    const wrapper = mount(AddEventModal, {
      props: {
        show: true,
        initialData: { id: 'task-1', type: 'task', title: '任务' }
      },
      global: { stubs }
    })

    const saveBtn = wrapper.findAll('button').find(b => b.text() === '保存修改')
    const deleteBtn = wrapper.findAll('button').find(b => b.text() === '删除此任务')

    expect(saveBtn?.attributes('disabled')).toBeDefined()
    expect(deleteBtn?.attributes('disabled')).toBeDefined()
  })
})
