import { act, renderHook, waitFor } from '@testing-library/react-native'

const mockGetCurrentSession = jest.fn()
const mockSubscribeToAuthChanges = jest.fn()
const authModulePath = require.resolve('../../../services/supabase/auth')

jest.doMock(authModulePath, () => ({
  getCurrentSession: (...args: unknown[]) => mockGetCurrentSession(...args),
  subscribeToAuthChanges: (...args: unknown[]) => mockSubscribeToAuthChanges(...args)
}))

const { useAuthSession } = require('../useAuthSession')

describe('useAuthSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCurrentSession.mockResolvedValue(null)
    mockSubscribeToAuthChanges.mockReturnValue(() => {})
  })

  it('exposes unauthenticated state when there is no session', async () => {
    const { result } = renderHook(() => useAuthSession())

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
      expect(result.current.session).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  it('updates state from auth subscription and unsubscribes on cleanup', async () => {
    const unsubscribe = jest.fn()
    let onAuthChange: ((session: unknown) => void) | undefined

    mockSubscribeToAuthChanges.mockImplementation((callback) => {
      onAuthChange = callback
      return unsubscribe
    })

    const { result, unmount } = renderHook(() => useAuthSession())

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    const session = { user: { id: 'user-1' } } as never

    act(() => {
      onAuthChange?.(session)
    })

    await waitFor(() => {
      expect(result.current.session).toBe(session)
      expect(result.current.isAuthenticated).toBe(true)
    })

    unmount()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
