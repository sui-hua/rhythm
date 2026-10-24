// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from '@/components/ui/badge/Badge.vue'

describe('Badge 组件测试', () => {
  it('默认插槽渲染文本内容', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: '测试文本'
      }
    })
    expect(wrapper.text()).toBe('测试文本')
  })

  it('默认 variant 应包含 primary 背景色类', () => {
    const wrapper = mount(Badge, {
      slots: { default: '标签' }
    })
    // 默认 variant 为 default，应包含 bg-primary 类
    expect(wrapper.classes()).toContain('bg-primary')
  })

  it('destructive variant 应包含 destructive 背景色类', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'destructive' },
      slots: { default: '删除' }
    })
    expect(wrapper.classes()).toContain('bg-destructive')
  })

  it('outline variant 应包含 text-foreground 类', () => {
    const wrapper = mount(Badge, {
      props: { variant: 'outline' },
      slots: { default: '轮廓' }
    })
    expect(wrapper.classes()).toContain('text-foreground')
  })

  it('支持自定义 class 属性', () => {
    const wrapper = mount(Badge, {
      props: { class: 'my-custom-class' },
      slots: { default: '自定义' }
    })
    expect(wrapper.classes()).toContain('my-custom-class')
  })

  it('渲染为 div 元素', () => {
    const wrapper = mount(Badge, {
      slots: { default: '元素检查' }
    })
    expect(wrapper.element.tagName).toBe('DIV')
  })
})
