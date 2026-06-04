import { describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { useTimelineDragSession } from '@/views/day/composables/useTimelineDragSession'
import type { DraggableTask, DragCommitPayload } from '@/views/day/composables/useTimelineDragSession'

// 创建可拖拽任务的辅助函数，返回完整的 DraggableTask 对象
function createTask(overrides: Partial<DraggableTask> = {}): DraggableTask {
  return {
    id: 'task-1',
    type: 'task',
    completed: false,
    startHour: 9,
    durationHours: 1,
    ...overrides
  }
}

describe('useTimelineDragSession', () => {
  it('does not activate drag when pointer movement stays under the threshold', async () => {
    const task = createTask()
    const onCommit: Mock<[DragCommitPayload], Promise<void>> = vi.fn<(payload: DragCommitPayload) => Promise<void>>().mockResolvedValue(undefined)
    const session = useTimelineDragSession({ task, onCommit })

    session.startDrag({ clientY: 100 } as MouseEvent)
    session.updateFromMouse({ clientY: 103 } as MouseEvent)

    expect(session.isActive.value).toBe(false)
    expect(session.draftStartHour.value).toBe(null)
    expect(session.draftDurationHours.value).toBe(null)

    await session.finish()
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('updates draft start hour while dragging before save', () => {
    const task = createTask()
    const onCommit: Mock<[DragCommitPayload], Promise<void>> = vi.fn<(payload: DragCommitPayload) => Promise<void>>().mockResolvedValue(undefined)
    const session = useTimelineDragSession({ task, onCommit })

    session.startDrag({ clientY: 100 } as MouseEvent)
    session.updateFromMouse({ clientY: 190 } as MouseEvent)

    expect(session.draftStartHour.value).toBe(9.5)
    expect(session.draftDurationHours.value).toBe(1)
  })

  it('updates draft duration while resizing before save', () => {
    const task = createTask()
    const onCommit: Mock<[DragCommitPayload], Promise<void>> = vi.fn<(payload: DragCommitPayload) => Promise<void>>().mockResolvedValue(undefined)
    const session = useTimelineDragSession({ task, onCommit })

    session.startResize({ clientY: 100 } as MouseEvent)
    session.updateFromMouse({ clientY: 145 } as MouseEvent)

    expect(session.draftStartHour.value).toBe(9)
    expect(session.draftDurationHours.value).toBe(1.25)
  })

  it('does not commit when snapped draft matches base values', async () => {
    const task = createTask()
    const onCommit: Mock<[DragCommitPayload], Promise<void>> = vi.fn<(payload: DragCommitPayload) => Promise<void>>().mockResolvedValue(undefined)
    const session = useTimelineDragSession({ task, onCommit })

    session.startDrag({ clientY: 100 } as MouseEvent)
    session.updateFromMouse({ clientY: 106 } as MouseEvent)
    await session.finish()

    expect(onCommit).not.toHaveBeenCalled()
    expect(session.isActive.value).toBe(false)
  })

  it('commits snapped hours once on mouseup', async () => {
    const task = createTask()
    const onCommit: Mock<[DragCommitPayload], Promise<void>> = vi.fn<(payload: DragCommitPayload) => Promise<void>>().mockResolvedValue(undefined)
    const session = useTimelineDragSession({ task, onCommit })

    session.startDrag({ clientY: 100 } as MouseEvent)
    session.updateFromMouse({ clientY: 190 } as MouseEvent)
    await session.finish()

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith({
      newStartHour: 9.5,
      newEndHour: 10.5
    })
  })

  it('uses the latest task position as the next drag baseline', () => {
    const task = createTask()
    const onCommit: Mock<[DragCommitPayload], Promise<void>> = vi.fn<(payload: DragCommitPayload) => Promise<void>>().mockResolvedValue(undefined)
    const session = useTimelineDragSession({
      getTask: () => task,
      onCommit
    })

    task.startHour = 11
    task.durationHours = 1.5

    session.startDrag({ clientY: 100 } as MouseEvent)
    session.updateFromMouse({ clientY: 190 } as MouseEvent)

    expect(session.draftStartHour.value).toBe(11.5)
    expect(session.draftDurationHours.value).toBe(1.5)
  })

  it('clears draft values and exits active mode after failed save', async () => {
    const task = createTask()
    const onCommit: Mock<[DragCommitPayload], Promise<void>> = vi.fn<(payload: DragCommitPayload) => Promise<void>>().mockRejectedValue(new Error('save failed'))
    const session = useTimelineDragSession({ task, onCommit })

    session.startDrag({ clientY: 100 } as MouseEvent)
    session.updateFromMouse({ clientY: 190 } as MouseEvent)
    await session.finish()

    expect(session.draftStartHour.value).toBe(null)
    expect(session.draftDurationHours.value).toBe(null)
    expect(session.isActive.value).toBe(false)
  })
})
