import { act, renderHook, waitFor } from '@testing-library/react-native'
import { setSession, signInLocal, signOutLocal, type AppSession } from '@/services/api/session'
import { useAuthSession } from '../useAuthSession'

describe('useAuthSession', () => {
  beforeEach(() => {
    signOutLocal()
  })

  it('未登录时暴露未认证状态', () => {
    const { result } = renderHook(() => useAuthSession())

    expect(result.current.isReady).toBe(true)
    expect(result.current.session).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('本地登录后同步会话状态', async () => {
    const { result } = renderHook(() => useAuthSession())

    act(() => {
      signInLocal('dev@localhost')
    })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.session?.user.email).toBe('dev@localhost')
    })
  })

  it('外部直接设置会话时也能收到通知', async () => {
    const { result } = renderHook(() => useAuthSession())
    const session: AppSession = { user: { id: 'user-1', email: 'a@b.c' } }

    act(() => {
      setSession(session)
    })

    await waitFor(() => {
      expect(result.current.session).toEqual(session)
    })
  })
})
