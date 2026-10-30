import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PortalHost } from '@rn-primitives/portal'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { DayScreen } from '../screens/DayScreen'

// DayScreen 已接入真实数据层（TanStack Query + Nest API），
// 测试改为 mock 服务层喂固定数据，不再依赖 src/mocks 的种子
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
  ]),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
  toggleTaskComplete: jest.fn().mockResolvedValue({})
}))

jest.mock('@/services/api/dailyPlans', () => ({
  listDailyPlansForDate: jest.fn().mockResolvedValue([]),
  toggleDailyPlanComplete: jest.fn().mockResolvedValue({})
}))

jest.mock('@/services/api/habits', () => ({
  listHabits: jest.fn().mockResolvedValue([]),
  listHabitLogsForDate: jest.fn().mockResolvedValue([]),
  createHabitLog: jest.fn(),
  deleteHabitLog: jest.fn()
}))

// 每个用例独立 QueryClient，避免缓存串场
function renderDayScreen() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: 0, retry: false }
    }
  })

  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  return render(
    <Wrapper>
      <DayScreen />
      <PortalHost />
    </Wrapper>
  )
}

describe('DayScreen', () => {
  it('renders date header, scheduled item and add task button', async () => {
    renderDayScreen()

    // 日期栏按设计稿展示「M月D日 周X」，正则匹配避免依赖运行日期
    expect(screen.getByText(/月\d+日 周/)).toBeTruthy()
    expect(await screen.findByText('晨间整理')).toBeTruthy()
    expect(screen.getByLabelText('新增任务')).toBeTruthy()
  })

  it('opens task editor from add button', () => {
    renderDayScreen()

    fireEvent.press(screen.getByLabelText('新增任务'))

    expect(screen.getByText('新建任务')).toBeTruthy()
  })

  it('toggles an execution item through the completion mutation', async () => {
    renderDayScreen()

    fireEvent.press(await screen.findByLabelText('完成晨间整理'))

    await waitFor(() => {
      const { toggleTaskComplete } = require('@/services/api/tasks')
      expect(toggleTaskComplete).toHaveBeenCalledWith('task-1', true)
    })
  })
})
