import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态 userId=null, user=null', () => {
    const store = useAuthStore()
    expect(store.userId).toBeNull()
    expect(store.user).toBeNull()
  })

  it('setUser 正常对象 → userId 和 user 被设置', () => {
    const store = useAuthStore()
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    store.setUser(mockUser)

    expect(store.userId).toBe('user-123')
    expect(store.user).toEqual(mockUser)
  })

  it('setUser(null) → userId=null, user=null', () => {
    const store = useAuthStore()
    store.setUser({ id: 'user-123', email: 'test@example.com' })
    expect(store.userId).toBe('user-123')

    store.setUser(null)
    expect(store.userId).toBeNull()
    expect(store.user).toBeNull()
  })

  it('clearAuth → 重置为 null', () => {
    const store = useAuthStore()
    store.setUser({ id: 'user-456', email: 'another@example.com' })
    expect(store.userId).toBe('user-456')

    store.clearAuth()
    expect(store.userId).toBeNull()
    expect(store.user).toBeNull()
  })
})
