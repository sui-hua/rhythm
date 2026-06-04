import { describe, expect, it } from 'vitest'
import { buildSummaryPayload, mapSummaryRowToRecord, toUnifiedSummaryPayload } from '@/views/summary/utils/summaryAdapters'
import type { SummaryRow, BuildSummaryPayloadParams } from '@/views/summary/utils/summaryAdapters'
import { buildDefaultPeriod } from '@/views/summary/utils/summaryPeriods'
import type { Period } from '@/views/summary/utils/summaryPeriods'
import { summaryKindToTab, summaryTabToKind } from '@/views/summary/utils/summaryRouteHelpers'

describe('mapSummaryRowToRecord', () => {
  it('maps a daily summary row into the unified record shape', () => {
    // 使用 SummaryRow 类型确保字段匹配数据库行结构
    const row: SummaryRow = {
      id: '1',
      user_id: 'u1',
      kind: 'daily',
      period_start: '2026-04-18T00:00:00.000Z',
      period_end: '2026-04-18T23:59:59.000Z',
      title: null,
      content: { done: '完成任务', improve: '少刷手机', tomorrow: '继续推进' },
      created_at: '2026-04-18T12:00:00.000Z',
      updated_at: '2026-04-18T12:00:00.000Z'
    }

    const record = mapSummaryRowToRecord(row)

    expect(record.kind).toBe('daily')
    expect(record.content).toEqual({
      done: '完成任务',
      improve: '少刷手机',
      tomorrow: '继续推进'
    })
    expect(record.updated_at).toBe('2026-04-18T12:00:00.000Z')
  })

  it('normalizes legacy string content into a text object', () => {
    const row: SummaryRow = {
      id: '2',
      user_id: 'u1',
      kind: 'monthly',
      period_start: '2026-04-01T00:00:00.000Z',
      period_end: '2026-04-30T23:59:59.000Z',
      title: '四月复盘',
      content: '本月整体推进稳定',
      created_at: '2026-04-30T12:00:00.000Z'
    }

    const record = mapSummaryRowToRecord(row)

    expect(record.content).toEqual({ text: '本月整体推进稳定' })
    expect(record.updated_at).toBe('2026-04-30T12:00:00.000Z')
  })
})

describe('buildSummaryPayload', () => {
  it('builds a monthly payload with unified content and period fields', () => {
    // 使用 BuildSummaryPayloadParams 类型确保参数结构正确
    const params: BuildSummaryPayloadParams = {
      kind: 'monthly',
      userId: 'u1',
      period: {
        periodStart: '2026-04-01T00:00:00.000Z',
        periodEnd: '2026-04-30T23:59:59.000Z'
      },
      formData: {
        title: '四月复盘',
        text: '本月整体推进稳定'
      }
    }

    const payload = buildSummaryPayload(params)

    expect(payload).toEqual({
      user_id: 'u1',
      kind: 'monthly',
      period_start: '2026-04-01T00:00:00.000Z',
      period_end: '2026-04-30T23:59:59.000Z',
      title: '四月复盘',
      content: { text: '本月整体推进稳定' }
    })
  })

  it('builds a daily payload from the daily form fields', () => {
    const params: BuildSummaryPayloadParams = {
      kind: 'daily',
      userId: 'u1',
      period: {
        periodStart: '2026-04-18T00:00:00.000Z',
        periodEnd: '2026-04-18T23:59:59.000Z'
      },
      formData: {
        done: '完成任务',
        improve: '少刷手机',
        tomorrow: '继续推进'
      }
    }

    const payload = buildSummaryPayload(params)

    expect(payload.title).toBeNull()
    expect(payload.content).toEqual({
      done: '完成任务',
      improve: '少刷手机',
      tomorrow: '继续推进'
    })
  })
})

describe('toUnifiedSummaryPayload', () => {
  it('accepts a weekly summary with unified payload format', () => {
    // 使用 kind 字段（当前实现要求），而非废弃的 scope 字段
    const payload = toUnifiedSummaryPayload({
      kind: 'weekly',
      user_id: 'u1',
      period_start: '2026-04-14T00:00:00.000Z',
      period_end: '2026-04-20T23:59:59.000Z',
      content: { text: '周总结' }
    })

    expect(payload.kind).toBe('weekly')
    expect(payload.period_start).toBe('2026-04-14T00:00:00.000Z')
    expect(payload.content).toEqual({ text: '周总结' })
  })

  it('rejects payloads without kind field', () => {
    // 当前实现：缺少 kind 时抛出 "Summary payload is missing kind"
    expect(() => toUnifiedSummaryPayload({
      scope: 'quarter',
      user_id: 'u1'
    })).toThrow('Summary payload is missing kind')
  })
})

describe('buildDefaultPeriod', () => {
  it('builds a weekly period anchored to Monday through Sunday', () => {
    const period: Period = buildDefaultPeriod('weekly', new Date('2026-04-18T12:00:00.000Z'))
    const start = new Date(period.periodStart)
    const end = new Date(period.periodEnd)

    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(3)
    expect(start.getDate()).toBe(13)
    expect(end.getFullYear()).toBe(2026)
    expect(end.getMonth()).toBe(3)
    expect(end.getDate()).toBe(19)
  })
})

describe('summaryRouteHelpers', () => {
  it('maps summary tabs to unified kinds', () => {
    expect(summaryTabToKind('day')).toBe('daily')
    expect(summaryTabToKind('week')).toBe('weekly')
    expect(summaryTabToKind('month')).toBe('monthly')
    expect(summaryTabToKind('year')).toBe('yearly')
  })

  it('maps unified kinds back to tabs', () => {
    expect(summaryKindToTab('daily')).toBe('day')
    expect(summaryKindToTab('weekly')).toBe('week')
    expect(summaryKindToTab('monthly')).toBe('month')
    expect(summaryKindToTab('yearly')).toBe('year')
  })
})
