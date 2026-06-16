import { describe, it, expect, vi, beforeEach } from 'vitest'

// mock db
vi.mock('@/services/database', () => ({
  db: {
    task: {
      list: vi.fn()
    },
    dailyReportLog: {
      getByUserAndDate: vi.fn(),
      create: vi.fn()
    }
  }
}))

// mock authStore
const mockUserId = { value: 'user-123' }
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    get userId() { return mockUserId.value }
  })
}))

// mock dateFormatter — getDayRange 必须返回 Date 对象，因为源码调用了 .getTime()
vi.mock('@/utils/dateFormatter', () => ({
  toDateOnly: vi.fn(() => '2026-06-05'),
  getDayRange: vi.fn(() => ({
    start: new Date('2026-06-05T00:00:00'),
    end: new Date('2026-06-05T23:59:59')
  }))
}))

import { db } from '@/services/database'
import { useDailyReport } from '../useDailyReport'

describe('useDailyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserId.value = 'user-123'
  })

  // openIfNeeded：userId 为 null 时早返回，不查询数据库
  it('openIfNeeded userId 为 null 时直接返回', async () => {
    mockUserId.value = null
    const { openIfNeeded, reportVisible } = useDailyReport()
    await openIfNeeded()
    expect(db.dailyReportLog.getByUserAndDate).not.toHaveBeenCalled()
    expect(reportVisible.value).toBe(false)
  })

  // openIfNeeded：今日已有记录时跳过，不弹窗
  it('openIfNeeded 今日已有查看记录时跳过弹窗', async () => {
    vi.mocked(db.dailyReportLog.getByUserAndDate).mockResolvedValue({ id: 1 })
    const { openIfNeeded, reportVisible } = useDailyReport()
    await openIfNeeded()
    expect(reportVisible.value).toBe(false)
    expect(db.task.list).not.toHaveBeenCalled()
  })

  // openIfNeeded：无记录时构建统计数据并弹窗
  it('openIfNeeded 无记录时构建统计并显示弹窗', async () => {
    vi.mocked(db.dailyReportLog.getByUserAndDate).mockResolvedValue(null)
    vi.mocked(db.task.list)
      .mockResolvedValueOnce([
        { completed: true, created_at: '2026-06-01T10:00:00' },
        { completed: false, created_at: '2026-06-01T10:00:00' }
      ])
      .mockResolvedValueOnce([
        { completed: false, created_at: '2026-06-05T10:00:00' }
      ])

    const { openIfNeeded, reportVisible, reportStats } = useDailyReport()
    await openIfNeeded()

    expect(reportVisible.value).toBe(true)
    expect(reportStats.value.yesterdayCompleted).toBe(1)
    expect(reportStats.value.yesterdayUncompleted).toBe(1)
    expect(reportStats.value.todayTotal).toBe(1)
  })

  // openIfNeeded：传入已加载的今日任务时，复用该数据避免重复查询今日 task
  it('openIfNeeded 复用已加载的今日任务统计 todayTotal', async () => {
    vi.mocked(db.dailyReportLog.getByUserAndDate).mockResolvedValue(null)
    vi.mocked(db.task.list).mockResolvedValueOnce([
      { completed: true, created_at: '2026-06-01T10:00:00' },
      { completed: false, created_at: '2026-06-01T10:00:00' }
    ])

    const { openIfNeeded, reportStats } = useDailyReport()
    await openIfNeeded({
      todayTasks: [
        { completed: false, created_at: '2026-06-05T10:00:00' },
        { completed: true, created_at: '2026-06-05T11:00:00' }
      ]
    })

    expect(db.task.list).toHaveBeenCalledTimes(1)
    expect(reportStats.value.todayTotal).toBe(2)
  })

  // buildStats：空数据时统计全为 0
  it('buildStats 空数据时统计全为 0', async () => {
    vi.mocked(db.dailyReportLog.getByUserAndDate).mockResolvedValue(null)
    vi.mocked(db.task.list).mockResolvedValue([])

    const { openIfNeeded, reportStats } = useDailyReport()
    await openIfNeeded()

    expect(reportStats.value).toEqual({
      yesterdayCompleted: 0,
      yesterdayUncompleted: 0,
      todayTotal: 0,
      carryoverToToday: 0
    })
  })

  // closeReport：关闭弹窗并记录查看状态
  it('closeReport 关闭弹窗并写入记录', async () => {
    vi.mocked(db.dailyReportLog.create).mockResolvedValue({ id: 1 })
    const { closeReport, reportVisible } = useDailyReport()
    reportVisible.value = true
    await closeReport()
    expect(reportVisible.value).toBe(false)
    expect(db.dailyReportLog.create).toHaveBeenCalledWith({
      user_id: 'user-123',
      report_date: '2026-06-05'
    })
  })
})
