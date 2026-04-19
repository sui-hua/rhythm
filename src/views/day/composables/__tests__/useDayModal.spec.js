import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn(),
    watch: vi.fn()
  }
})

vi.mock('@/views/day/composables/useDayData', () => ({
  useDayData: vi.fn(() => ({
    dailySchedule: { value: [] }
  }))
}))

describe('useDayModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens add modal and sets editingTaskIndex to null', async () => {
    const { useDayModal } = await import('@/views/day/composables/useDayModal')
    const modal = useDayModal()

    expect(modal.showAddModal.value).toBe(false)

    modal.openAddModal()

    expect(modal.showAddModal.value).toBe(true)
    expect(modal.editingTask.value).toBe(null)
  })
})
