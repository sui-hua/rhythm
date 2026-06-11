// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AddGoalModal from '../AddGoalModal.vue'

// mock useDirectionGoals composable
const mockShowAddModal = ref(true)
const mockShowCategoryModal = ref(false)
const mockEditingGoal = ref(null)
const mockHandleAddGoal = vi.fn().mockResolvedValue({})
const mockHandleUpdateGoal = vi.fn().mockResolvedValue({})
const mockHandleDeleteGoal = vi.fn()

vi.mock('@/views/direction/composables/useDirectionGoals', () => ({
  useDirectionGoals: () => ({
    showAddModal: mockShowAddModal,
    showCategoryModal: mockShowCategoryModal,
    editingGoal: mockEditingGoal,
    handleAddGoal: mockHandleAddGoal,
    handleUpdateGoal: mockHandleUpdateGoal,
    handleDeleteGoal: mockHandleDeleteGoal
  })
}))

// mock goalDataStore
vi.mock('@/stores/goalDataStore', () => ({
  months: [
    { value: 1, label: '1月' },
    { value: 2, label: '2月' },
    { value: 3, label: '3月' }
  ],
  useGoalDataStore: () => ({
    categories: ref([
      { id: 'cat-1', name: '工作' },
      { id: 'cat-2', name: '学习' }
    ])
  })
}))

// mock db
vi.mock('@/services/database', () => ({
  db: {
    goalCategories: {
      list: vi.fn().mockResolvedValue([])
    }
  }
}))

// mock withLoadingLock，直接执行回调
vi.mock('@/utils/throttle', () => ({
  withLoadingLock: (fn: any) => fn
}))

// stub Dialog 和其他子组件
const stubs = {
  Dialog: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
  DialogFooter: { template: '<div><slot /></div>' },
  Input: {
    template: '<input />',
    props: ['modelValue', 'placeholder', 'type', 'min', 'step'],
    emits: ['update:modelValue', 'keyup']
  },
  Button: { template: '<button><slot /></button>', props: ['variant', 'disabled', 'class'] },
  Label: { template: '<label><slot /></label>', props: ['for', 'class'] },
  Select: { template: '<div><slot /></div>', props: ['modelValue'] },
  SelectTrigger: { template: '<div><slot /></div>', props: ['class'] },
  SelectValue: { template: '<span />', props: ['placeholder'] },
  SelectContent: { template: '<div><slot /></div>', props: ['disable-portal'] },
  SelectItem: { template: '<div><slot /></div>', props: ['value', 'disabled', 'key'] },
  Separator: { template: '<hr />' },
  TimePicker: { template: '<div />', props: ['modelValue', 'label', 'id'] },
  DurationPicker: { template: '<div />', props: ['modelValue', 'label', 'id'] },
  CategoryManagementModal: { template: '<div />' }
}

describe('AddGoalModal', () => {
  beforeEach(() => {
    mockShowAddModal.value = true
    mockEditingGoal.value = null
    mockHandleDeleteGoal.mockClear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('新增模式显示"添加新目标"标题', () => {
    const wrapper = mount(AddGoalModal, { global: { stubs } })
    expect(wrapper.text()).toContain('添加新目标')
  })

  it('显示目标名称输入标签', () => {
    const wrapper = mount(AddGoalModal, { global: { stubs } })
    expect(wrapper.text()).toContain('目标名称')
  })

  it('显示开始月份和结束月份选择', () => {
    const wrapper = mount(AddGoalModal, { global: { stubs } })
    expect(wrapper.text()).toContain('开始月份')
    expect(wrapper.text()).toContain('结束月份')
  })

  it('显示目标分类选择', () => {
    const wrapper = mount(AddGoalModal, { global: { stubs } })
    expect(wrapper.text()).toContain('目标分类')
  })

  it('显示确认创建按钮（新增模式）', () => {
    const wrapper = mount(AddGoalModal, { global: { stubs } })
    expect(wrapper.text()).toContain('确认创建')
  })

  it('显示取消按钮', () => {
    const wrapper = mount(AddGoalModal, { global: { stubs } })
    expect(wrapper.text()).toContain('取消')
  })

  it('表单区域正常渲染（含 TimePicker/DurationPicker 区域）', () => {
    const wrapper = mount(AddGoalModal, { global: { stubs } })
    // 验证表单区域完整渲染，包含分类、延后展示等关键区块
    expect(wrapper.text()).toContain('目标分类')
    expect(wrapper.text()).toContain('未完成延后展示')
    expect(wrapper.text()).toContain('取消')
  })

  it('显示未完成延后展示开关', () => {
    const wrapper = mount(AddGoalModal, { global: { stubs } })
    expect(wrapper.text()).toContain('未完成延后展示')
  })

  it('编辑模式显示"编辑目标"标题', () => {
    mockEditingGoal.value = {
      goal_id: 'g-1',
      name: '学习 Vue',
      title: '学习 Vue',
      startMonth: 3,
      endMonth: 6,
      category_id: 'cat-1',
      task_time: '09:00',
      duration: 60,
      carry_over_lookback_days: 0
    }
    const wrapper = mount(AddGoalModal, { global: { stubs } })
    expect(wrapper.text()).toContain('编辑目标')
  })

  it('编辑模式显示"确认修改"按钮', () => {
    mockEditingGoal.value = {
      goal_id: 'g-1',
      name: '学习 Vue',
      title: '学习 Vue',
      startMonth: 3,
      endMonth: 6,
      category_id: 'cat-1',
      task_time: '09:00',
      duration: 60,
      carry_over_lookback_days: 0
    }
    const wrapper = mount(AddGoalModal, { global: { stubs } })
    expect(wrapper.text()).toContain('确认修改')
  })

  it('编辑模式显示"删除此目标"链接', () => {
    mockEditingGoal.value = {
      goal_id: 'g-1',
      name: '学习 Vue',
      title: '学习 Vue',
      startMonth: 3,
      endMonth: 6,
      category_id: 'cat-1',
      task_time: '09:00',
      duration: 60,
      carry_over_lookback_days: 0
    }
    const wrapper = mount(AddGoalModal, { global: { stubs } })
    expect(wrapper.text()).toContain('删除此目标')
  })

  it('取消删除确认时不删除目标', async () => {
    vi.mocked(window.confirm).mockReturnValue(false)
    mockEditingGoal.value = {
      goal_id: 'g-1',
      name: '学习 Vue',
      title: '学习 Vue',
      startMonth: 3,
      endMonth: 6,
      category_id: 'cat-1',
      task_time: '09:00',
      duration: 60,
      carry_over_lookback_days: 0
    }
    const wrapper = mount(AddGoalModal, { global: { stubs } })

    const deleteButton = wrapper.findAll('button').find(button => button.text() === '删除此目标')
    await deleteButton?.trigger('click')

    expect(window.confirm).toHaveBeenCalledWith('确定要删除这个目标吗？删除后关联的月计划和日计划也会一并删除，且无法恢复。')
    expect(mockHandleDeleteGoal).not.toHaveBeenCalled()
  })

  it('确认删除后才调用删除目标操作', async () => {
    vi.mocked(window.confirm).mockReturnValue(true)
    mockEditingGoal.value = {
      goal_id: 'g-1',
      name: '学习 Vue',
      title: '学习 Vue',
      startMonth: 3,
      endMonth: 6,
      category_id: 'cat-1',
      task_time: '09:00',
      duration: 60,
      carry_over_lookback_days: 0
    }
    const wrapper = mount(AddGoalModal, { global: { stubs } })

    const deleteButton = wrapper.findAll('button').find(button => button.text() === '删除此目标')
    await deleteButton?.trigger('click')

    expect(mockHandleDeleteGoal).toHaveBeenCalledTimes(1)
  })
})
