// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import MissionBoardMonthBody from '../MissionBoardMonthBody.vue'

const mockIsSubmitting = ref(false)
const mockBatchInput = ref('批量任务')

vi.mock('@/views/direction/composables/useDirectionSelection', () => ({
  useDirectionSelection: () => ({
    selectedDates: { 4: [1, 2] },
    hasTask: () => true,
    isSelected: () => true,
    canSelect: () => true,
    startSelection: vi.fn(),
    handleMouseEnter: vi.fn(),
    endSelection: vi.fn(),
    getMonthOffset: () => 0,
    selectWeekDay: vi.fn(),
    isAllSelectedDatesHaveTask: () => true
  })
}))

vi.mock('@/views/direction/composables/useDirectionBatch', () => ({
  useDirectionBatch: () => ({
    batchInput: mockBatchInput,
    applyBatchTask: vi.fn(),
    handleBatchDelete: vi.fn(),
    isSubmitting: mockIsSubmitting
  })
}))

const stubs = {
  Input: {
    template: '<input :value="modelValue" />',
    props: ['modelValue']
  },
  Button: {
    template: '<button :disabled="disabled"><slot /></button>',
    props: ['disabled']
  },
  Transition: {
    template: '<div><slot /></div>'
  }
}

describe('MissionBoardMonthBody', () => {
  it('批量操作提交中禁用修改和删除按钮', () => {
    mockIsSubmitting.value = true

    const wrapper = mount(MissionBoardMonthBody, {
      props: { month: 4 },
      global: { stubs }
    })

    const updateBtn = wrapper.findAll('button').find(b => b.text() === '修改')
    const deleteBtn = wrapper.findAll('button').find(b => b.text() === '删除')

    expect(updateBtn?.attributes('disabled')).toBeDefined()
    expect(deleteBtn?.attributes('disabled')).toBeDefined()
  })
})
