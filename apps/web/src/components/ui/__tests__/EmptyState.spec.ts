import { describe, expect, it } from 'vitest'
import EmptyState from '@/components/ui/EmptyState.vue'

describe('EmptyState', () => {
  it('declares title and description props', () => {
    // Vue 组件的 props 定义在运行时可访问
    const component = EmptyState as Record<string, unknown>
    expect(component.props).toBeDefined()
    expect((component.props as Record<string, unknown>).title).toBeDefined()
    expect((component.props as Record<string, unknown>).description).toBeDefined()
  })
})

