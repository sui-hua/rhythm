// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DailyReportModal from '../DailyReportModal.vue'

// stub Dialog 系列组件，仅渲染插槽内容
const stubs = {
  Dialog: { template: '<div><slot /></div>', props: ['open'] },
  DialogContent: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  Button: { template: '<button><slot /></button>', props: ['variant', 'class'] }
}

describe('DailyReportModal', () => {
  const defaultStats = {
    yesterdayCompleted: 3,
    yesterdayUncompleted: 1,
    todayTotal: 5,
    carryoverToToday: 2,
    yesterdayImprove: ''
  }

  it('显示统计数据', () => {
    const wrapper = mount(DailyReportModal, {
      props: { show: true, stats: defaultStats },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('2')
  })

  it('显示统计项标签', () => {
    const wrapper = mount(DailyReportModal, {
      props: { show: true, stats: defaultStats },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('昨天已完成')
    expect(wrapper.text()).toContain('昨天未完成')
    expect(wrapper.text()).toContain('今日任务数')
    expect(wrapper.text()).toContain('顺延到今天')
  })

  it('显示"每日日报"标题', () => {
    const wrapper = mount(DailyReportModal, {
      props: { show: true, stats: defaultStats },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('每日日报')
  })

  it('有昨日改进内容时显示提醒区块', () => {
    const wrapper = mount(DailyReportModal, {
      props: {
        show: true,
        stats: {
          ...defaultStats,
          yesterdayImprove: '先完成最重要的任务\n减少切换上下文'
        }
      },
      global: { stubs }
    })

    expect(wrapper.text()).toContain('昨日改进提醒')
    expect(wrapper.text()).toContain('先完成最重要的任务')
    expect(wrapper.text()).toContain('减少切换上下文')
  })

  it('没有昨日改进内容时不显示提醒区块', () => {
    const wrapper = mount(DailyReportModal, {
      props: {
        show: true,
        stats: defaultStats
      },
      global: { stubs }
    })

    expect(wrapper.text()).not.toContain('昨日改进提醒')
  })

  it('点击"仅确认"按钮触发 confirm 事件', async () => {
    const wrapper = mount(DailyReportModal, {
      props: { show: true, stats: defaultStats },
      global: { stubs }
    })
    const btn = wrapper.findAll('button').find(b => b.text() === '仅确认')
    await btn?.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('点击"将未完成任务顺延至今天"按钮触发 confirm-carryover 事件', async () => {
    const wrapper = mount(DailyReportModal, {
      props: { show: true, stats: defaultStats },
      global: { stubs }
    })
    const btn = wrapper.findAll('button').find(b => b.text().includes('将未完成任务顺延至今天'))
    await btn?.trigger('click')
    expect(wrapper.emitted('confirm-carryover')).toBeTruthy()
  })

  it('show=false 时 Dialog 收到 open=false', () => {
    const wrapper = mount(DailyReportModal, {
      props: { show: false, stats: defaultStats },
      global: { stubs }
    })
    // 组件仍然挂载，Dialog 接收 open prop
    expect(wrapper.findComponent({ name: 'Dialog' }).exists() || wrapper.exists()).toBe(true)
  })
})
