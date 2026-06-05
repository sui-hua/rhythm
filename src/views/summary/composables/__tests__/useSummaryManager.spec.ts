import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// mock vue 的 onMounted
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn()
  }
})

// mock authStore
const mockUserId = { value: 'user-123' }
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    get userId() { return mockUserId.value }
  })
}))

// mock db
const mockListByKind = vi.fn()
const mockSave = vi.fn()
const mockRemove = vi.fn()
vi.mock('@/services/database', () => ({
  db: {
    summary: {
      listByKind: (...args: any[]) => mockListByKind(...args),
      save: (...args: any[]) => mockSave(...args),
      remove: (...args: any[]) => mockRemove(...args)
    }
  }
}))

// mock summary 工具函数
vi.mock('@/views/summary/utils/summaryPeriods', () => ({
  buildDefaultPeriod: vi.fn(() => ({
    periodStart: '2026-06-01',
    periodEnd: '2026-06-05'
  }))
}))

vi.mock('@/views/summary/utils/summaryAdapters', () => ({
  buildSummaryPayload: vi.fn((params: any) => ({
    ...params,
    kind: params.kind,
    user_id: params.userId
  }))
}))

vi.mock('@/views/summary/utils/summaryRouteHelpers', () => ({
  summaryTabToKind: vi.fn((tabId: string) => {
    const map: Record<string, string> = { day: 'daily', week: 'weekly', month: 'monthly', year: 'yearly' }
    return map[tabId] || 'daily'
  })
}))

// mock confirm
vi.stubGlobal('confirm', vi.fn(() => true))

import { useSummaryManager } from '../useSummaryManager'

describe('useSummaryManager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockUserId.value = 'user-123'
    mockListByKind.mockResolvedValue([])
  })

  // handleTabChange：切换 tab 并重新加载数据
  it('handleTabChange 切换 tab 重置状态并加载数据', async () => {
    const { handleTabChange, activeTab, selectedSummary, isCreating } = useSummaryManager()
    selectedSummary.value = { id: 1, kind: 'daily' } as any
    isCreating.value = true

    handleTabChange('week')

    expect(activeTab.value).toBe('week')
    expect(selectedSummary.value).toBeNull()
    expect(isCreating.value).toBe(false)
    // loadSummaries 被触发
    await vi.waitFor(() => {
      expect(mockListByKind).toHaveBeenCalledWith('weekly')
    })
  })

  // handleSelect：选中总结记录
  it('handleSelect 选中记录并退出创建模式', () => {
    const { handleSelect, selectedSummary, isCreating } = useSummaryManager()
    isCreating.value = true
    const summary = { id: 1, kind: 'daily', title: '测试' } as any
    handleSelect(summary)
    expect(selectedSummary.value).toEqual(summary)
    expect(isCreating.value).toBe(false)
  })

  // handleCreate：进入创建模式
  it('handleCreate 清空选中并进入创建模式', () => {
    const { handleCreate, selectedSummary, isCreating } = useSummaryManager()
    selectedSummary.value = { id: 1 } as any
    handleCreate()
    expect(selectedSummary.value).toBeNull()
    expect(isCreating.value).toBe(true)
  })

  // handleSave：保存成功后更新选中记录并刷新列表
  it('handleSave 保存成功后更新选中记录', async () => {
    const savedRecord = { id: 99, kind: 'daily', title: '已保存' }
    mockSave.mockResolvedValue(savedRecord)
    mockListByKind.mockResolvedValue([savedRecord])

    const { handleSave, selectedSummary, isCreating } = useSummaryManager()
    await handleSave({ done: '完成了', improve: '改进', tomorrow: '明天' })

    expect(selectedSummary.value).toEqual(savedRecord)
    expect(isCreating.value).toBe(false)
    expect(mockListByKind).toHaveBeenCalled()
  })

  // handleSave：无 userId 时抛出异常
  it('handleSave 无 userId 时不保存', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockUserId.value = null

    const { handleSave } = useSummaryManager()
    await handleSave({ done: 'test' })

    expect(mockSave).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  // currentView：创建中时为 form
  it('currentView 创建中时为 form', () => {
    const { handleCreate, currentView } = useSummaryManager()
    handleCreate()
    expect(currentView.value).toBe('form')
  })

  // currentView：选中记录时为 detail-or-edit
  it('currentView 选中记录时为 detail-or-edit', () => {
    const { handleSelect, currentView } = useSummaryManager()
    handleSelect({ id: 1, kind: 'daily' } as any)
    expect(currentView.value).toBe('detail-or-edit')
  })

  // currentView：默认为空
  it('currentView 默认为 empty', () => {
    const { currentView } = useSummaryManager()
    expect(currentView.value).toBe('empty')
  })

  // handleCancel：取消后退出创建模式
  it('handleCancel 退出创建模式', () => {
    const { handleCreate, handleCancel, isCreating } = useSummaryManager()
    handleCreate()
    expect(isCreating.value).toBe(true)
    handleCancel()
    expect(isCreating.value).toBe(false)
  })

  // handleDelete：确认后删除并刷新列表
  it('handleDelete 确认后删除记录并刷新', async () => {
    mockRemove.mockResolvedValue(undefined)
    mockListByKind.mockResolvedValue([])

    const { handleDelete, selectedSummary } = useSummaryManager()
    selectedSummary.value = { id: 1 } as any
    await handleDelete(1)

    expect(mockRemove).toHaveBeenCalledWith(1)
    expect(selectedSummary.value).toBeNull()
  })
})
