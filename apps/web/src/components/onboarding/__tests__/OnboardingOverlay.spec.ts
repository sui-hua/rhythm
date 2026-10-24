// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import OnboardingOverlay from '../OnboardingOverlay.vue'

// OnboardingOverlay 使用 Teleport to="body"，内容渲染到 document.body
// 因此需要从 document.body 查询元素和触发事件

describe('OnboardingOverlay', () => {
  afterEach(() => {
    // 清理 Teleport 到 body 的残留 DOM
    document.body.innerHTML = ''
  })

  it('visible=true 时在 body 中渲染遮罩层', () => {
    const wrapper = mount(OnboardingOverlay, {
      props: { visible: true, title: '欢迎', description: '这是第一步' }
    })
    const overlay = document.body.querySelector('.fixed.inset-0')
    expect(overlay).not.toBeNull()
    wrapper.unmount()
  })

  it('visible=false 时不在 body 中渲染遮罩层', () => {
    const wrapper = mount(OnboardingOverlay, {
      props: { visible: false, title: '欢迎', description: '这是第一步' }
    })
    const overlay = document.body.querySelector('.fixed.inset-0')
    expect(overlay).toBeNull()
    wrapper.unmount()
  })

  it('显示标题文本', () => {
    const wrapper = mount(OnboardingOverlay, {
      props: { visible: true, title: '创建第一个习惯', description: '描述内容' }
    })
    expect(document.body.textContent).toContain('创建第一个习惯')
    wrapper.unmount()
  })

  it('显示描述文本', () => {
    const wrapper = mount(OnboardingOverlay, {
      props: { visible: true, title: '标题', description: '请先创建你的第一个习惯' }
    })
    expect(document.body.textContent).toContain('请先创建你的第一个习惯')
    wrapper.unmount()
  })

  it('显示"首次引导"标签', () => {
    const wrapper = mount(OnboardingOverlay, {
      props: { visible: true, title: '标题', description: '描述' }
    })
    expect(document.body.textContent).toContain('首次引导')
    wrapper.unmount()
  })

  it('显示两个操作按钮', () => {
    const wrapper = mount(OnboardingOverlay, {
      props: { visible: true, title: '标题', description: '描述' }
    })
    expect(document.body.textContent).toContain('完成这一步')
    expect(document.body.textContent).toContain('稍后再说')
    wrapper.unmount()
  })

  it('点击"完成这一步"触发 complete 事件', async () => {
    const wrapper = mount(OnboardingOverlay, {
      props: { visible: true, title: '标题', description: '描述' }
    })
    // 从 document.body 查询按钮（Teleport 目标）
    const buttons = document.body.querySelectorAll('button')
    const completeBtn = Array.from(buttons).find(b => b.textContent?.includes('完成这一步'))
    expect(completeBtn).toBeDefined()
    completeBtn!.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('complete')).toBeTruthy()
    wrapper.unmount()
  })

  it('点击"稍后再说"触发 close 事件', async () => {
    const wrapper = mount(OnboardingOverlay, {
      props: { visible: true, title: '标题', description: '描述' }
    })
    const buttons = document.body.querySelectorAll('button')
    const closeBtn = Array.from(buttons).find(b => b.textContent?.includes('稍后再说'))
    expect(closeBtn).toBeDefined()
    closeBtn!.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('默认 visible 为 false', () => {
    const wrapper = mount(OnboardingOverlay, {
      props: { title: '标题', description: '描述' }
    })
    const overlay = document.body.querySelector('.fixed.inset-0')
    expect(overlay).toBeNull()
    wrapper.unmount()
  })
})
