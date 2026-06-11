// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { confirmDelete } from '@/composables/useDeleteConfirm'

describe('useDeleteConfirm', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('用户取消确认时返回 false 并阻止删除流程', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    const confirmed = confirmDelete('task')

    expect(confirmed).toBe(false)
    expect(confirmSpy).toHaveBeenCalledWith('确定要删除这个任务吗？删除后无法恢复。')
  })

  it('目标删除提示明确包含月计划和日计划影响', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const confirmed = confirmDelete('goal')

    expect(confirmed).toBe(true)
    expect(confirmSpy).toHaveBeenCalledWith('确定要删除这个目标吗？删除后关联的月计划和日计划也会一并删除，且无法恢复。')
  })

  it('批量日计划删除提示包含选中数量', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    confirmDelete({ type: 'goalDayBatch', count: 3 })

    expect(confirmSpy).toHaveBeenCalledWith('确定要删除选中的 3 条日计划吗？删除后无法恢复。')
  })
})
