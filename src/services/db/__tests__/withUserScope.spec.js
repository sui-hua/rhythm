import { describe, expect, it, vi } from 'vitest'
import { applyUserScope, resolveScopedUserId } from '@/services/db/withUserScope'

describe('withUserScope', () => {
  it('injects user_id filter into a query builder', () => {
    const eq = vi.fn().mockReturnThis()
    const query = { eq }

    applyUserScope('user-1', query)
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('resolves explicit user id before falling back to auth state', () => {
    expect(resolveScopedUserId('user-1', 'user-2')).toBe('user-1')
    expect(resolveScopedUserId(null, 'user-2')).toBe('user-2')
  })

  it('throws when no userId available', () => {
    expect(() => resolveScopedUserId(null, null)).toThrow('缺少 userId')
  })
})
