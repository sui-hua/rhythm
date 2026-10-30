import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react-native'

jest.mock('@/services/api/tasks', () => ({
  listTasksForDate: jest.fn().mockResolvedValue([
    {
      id: 'task-1',
      title: '晨间整理',
      startAt: '2026-04-28T01:00:00.000Z',
      endAt: '2026-04-28T01:30:00.000Z',
      notes: '',
      completed: false
    }
  ])
}))

jest.mock('@/services/api/dailyPlans', () => ({
  listDailyPlansForDate: jest.fn().mockResolvedValue([])
}))

jest.mock('@/services/api/habits', () => ({
  listHabits: jest.fn().mockResolvedValue([]),
  listHabitLogsForDate: jest.fn().mockResolvedValue([])
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

describe('useDayExecutionItems', () => {
  it('combines query results into scheduled and unscheduled items', async () => {
    const { useDayExecutionItems } = require('../hooks/useDayExecutionItems')
    const { result } = renderHook(() => useDayExecutionItems(new Date('2026-04-28T08:00:00.000Z')), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.scheduledItems).toHaveLength(1)
      expect(result.current.scheduledItems[0].title).toBe('晨间整理')
      expect(result.current.unscheduledItems).toHaveLength(0)
    })
  })
})
