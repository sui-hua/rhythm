import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'

jest.mock('../../../services/supabase/tasks', () => ({
  listTasksForDate: jest.fn().mockResolvedValue([])
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Infinity,
        retry: false
      }
    }
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDayTasks', () => {
  it('loads task groups for the selected day', async () => {
    const { useDayTasks } = require('../useDayTasks')
    const { result, unmount } = renderHook(() => useDayTasks(new Date('2026-04-21T08:00:00.000Z')), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(result.current.groups.scheduled).toEqual([])
    })

    unmount()
  })
})
