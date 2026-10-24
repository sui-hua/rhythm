// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import MissionBoardMonth from '../MissionBoardMonth.vue'

// mock useDirectionSelection
const mockSelectedMonth = ref(6)

vi.mock('@/views/direction/composables/useDirectionSelection', () => ({
  useDirectionSelection: () => ({
    selectedMonth: mockSelectedMonth
  })
}))

// stub 子组件，Card 需要 inheritAttrs 以接收动态 class
const stubs = {
  Card: { template: '<div v-bind="$attrs"><slot /></div>', inheritAttrs: false },
  MissionBoardMonthHeader: { template: '<div class="month-header">Month {{ month }}</div>', props: ['month'] },
  MissionBoardMonthBody: { template: '<div class="month-body">Body {{ month }}</div>', props: ['month'] }
}

describe('MissionBoardMonth', () => {
  it('渲染月份头组件', () => {
    const wrapper = mount(MissionBoardMonth, {
      props: { month: 6 },
      global: { stubs }
    })
    expect(wrapper.find('.month-header').exists()).toBe(true)
    expect(wrapper.find('.month-header').text()).toContain('6')
  })

  it('选中月份时渲染月度内容体', () => {
    mockSelectedMonth.value = 6
    const wrapper = mount(MissionBoardMonth, {
      props: { month: 6 },
      global: { stubs }
    })
    expect(wrapper.find('.month-body').exists()).toBe(true)
  })

  it('未选中月份时不渲染内容体', () => {
    mockSelectedMonth.value = 6
    const wrapper = mount(MissionBoardMonth, {
      props: { month: 3 },
      global: { stubs }
    })
    expect(wrapper.find('.month-body').exists()).toBe(false)
  })

  it('选中月份时卡片添加 is-active 类', () => {
    mockSelectedMonth.value = 6
    const wrapper = mount(MissionBoardMonth, {
      props: { month: 6 },
      global: { stubs }
    })
    expect(wrapper.classes()).toContain('is-active')
  })

  it('未选中月份时卡片无 is-active 类', () => {
    mockSelectedMonth.value = 6
    const wrapper = mount(MissionBoardMonth, {
      props: { month: 9 },
      global: { stubs }
    })
    expect(wrapper.classes()).not.toContain('is-active')
  })
})
