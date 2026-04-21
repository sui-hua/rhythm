import { describe, expect, it } from 'vitest'
import EmptyState from '@/components/ui/EmptyState.vue'

describe('EmptyState', () => {
  it('declares title and description props', () => {
    expect(EmptyState.props.title).toBeDefined()
    expect(EmptyState.props.description).toBeDefined()
  })
})
