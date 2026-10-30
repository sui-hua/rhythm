import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'

jest.mock('@/services/api/tasks', () => ({
  toggleTaskComplete: jest.fn().mockResolvedValue({})
}))

jest.mock('@/services/api/dailyPlans', () => ({
  toggleDailyPlanComplete: jest.fn().mockResolvedValue({})
}))

jest.mock('@/services/api/habits', () => ({
  listHabitLogsForDate: jest.fn().mockResolvedValue([]),
  createHabitLog: jest.fn().mockResolvedValue({ id: 'log-new', habitId: 'habit-1', completedAt: new Date().toISOString() }),
  deleteHabitLog: jest.fn().mockResolvedValue(undefined)
}))

function createHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Infinity,
        retry: false
      },
      mutations: {
        gcTime: 0,
        retry: false
      }
    }
  })

  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  return { Wrapper, queryClient }
}

describe('useExecutionItemToggle', () => {
  it('toggles task completion', async () => {
    const { useExecutionItemToggle } = require('../hooks/useExecutionItemToggle')
    const { Wrapper, queryClient } = createHarness()
    const { result } = renderHook(() => useExecutionItemToggle(new Date('2026-04-28')), {
      wrapper: Wrapper
    })

    const mockItem = {
      id: 'task-1',
      source: 'task' as const,
      title: '测试任务',
      description: '',
      startAt: '09:00',
      endAt: '10:00',
      startMinutes: 540,
      durationMinutes: 60,
      completed: false,
      categoryLabel: '个人任务' as const,
      readonly: false,
      original: { id: 'task-1', title: '测试任务', startAt: null, endAt: null, notes: '', completed: false }
    }

    await act(async () => {
      await result.current.toggleItem(mockItem)
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))

    const { toggleTaskComplete } = require('@/services/api/tasks')
    expect(toggleTaskComplete).toHaveBeenCalledWith('task-1', true)
    queryClient.clear()
  })
})
