import { describe, expect, it, vi, beforeEach } from 'vitest'

// Test that the module exports the correct API without initializing Supabase
describe('useNotifications API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns notificationPermission, hasAskedPermission and requestPermission', async () => {
    // Mock Notification global
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted')
    })
    vi.stubGlobal('navigator', {
      serviceWorker: {
        register: vi.fn().mockResolvedValue({ scope: '/' })
      }
    })

    const { useNotifications } = await import('@/composables/useNotifications')
    const result = useNotifications()

    expect(result).toHaveProperty('notificationPermission')
    expect(result).toHaveProperty('hasAskedPermission')
    expect(result).toHaveProperty('requestPermission')
    expect(result).toHaveProperty('showNotification')
    expect(result).toHaveProperty('startListening')
    expect(result).toHaveProperty('stopListening')
    expect(result).toHaveProperty('clearNotifiedHistory')
    expect(result).toHaveProperty('getPermissionStatus')

    vi.unstubAllGlobals()
  })

  it('hasAskedPermission defaults to false', async () => {
    vi.stubGlobal('Notification', { permission: 'default' })

    const { useNotifications } = await import('@/composables/useNotifications')
    const { hasAskedPermission } = useNotifications()

    expect(hasAskedPermission.value).toBe(false)

    vi.unstubAllGlobals()
  })
})
