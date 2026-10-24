import { fireEvent, render, screen } from '@testing-library/react-native'
import { PortalHost } from '@rn-primitives/portal'
import { DayScreen } from '../screens/DayScreen'

const mockToggleItem = jest.fn()

function renderDayScreen() {
  return render(
    <>
      <DayScreen />
      <PortalHost />
    </>
  )
}

jest.mock('../hooks/useDayExecutionItems', () => ({
  useDayExecutionItems: () => ({
    scheduledItems: [
      {
        id: 'task-1',
        source: 'task',
        title: '晨间整理',
        description: '确认今天安排',
        startAt: '09:00',
        endAt: '09:30',
        startMinutes: 540,
        durationMinutes: 30,
        completed: false,
        categoryLabel: '个人任务',
        readonly: false,
        original: {
          id: 'task-1',
          title: '晨间整理',
          startAt: '2026-04-28T01:00:00.000Z',
          endAt: '2026-04-28T01:30:00.000Z',
          notes: '确认今天安排',
          completed: false
        }
      }
    ],
    unscheduledItems: [],
    isLoading: false,
    errors: [],
    refetchAll: jest.fn()
  })
}))

jest.mock('../hooks/useExecutionItemToggle', () => ({
  useExecutionItemToggle: () => ({
    toggleItem: mockToggleItem,
    isPending: false
  })
}))

jest.mock('../hooks/useTaskMutations', () => ({
  useTaskMutations: () => ({
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    isSaving: false
  })
}))

describe('DayScreen', () => {
  beforeEach(() => {
    mockToggleItem.mockClear()
  })

  it('renders today header, scheduled item and add task button', () => {
    renderDayScreen()

    expect(screen.getByText('今天')).toBeTruthy()
    expect(screen.getByText('晨间整理')).toBeTruthy()
    expect(screen.getByLabelText('新增任务')).toBeTruthy()
  })

  it('opens task editor from add button', () => {
    renderDayScreen()

    fireEvent.press(screen.getByLabelText('新增任务'))

    expect(screen.getByText('新建任务')).toBeTruthy()
  })

  it('toggles an execution item from the card check control', () => {
    renderDayScreen()

    fireEvent.press(screen.getByLabelText('完成晨间整理'))

    expect(mockToggleItem).toHaveBeenCalledTimes(1)
  })
})
