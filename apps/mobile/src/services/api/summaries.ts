import { apiRequest } from './client'

/**
 * 总结模块。
 *
 * 后端 `summary` 表把内容存在 `content` jsonb 里，键名沿用 web 端的约定：
 *   daily  → done / improve / tomorrow / mood
 *   其它   → text
 * `period_start` 在库里是 timestamptz，这里统一裁成 YYYY-MM-DD 供界面展示。
 */

export type SummaryKind = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type SummaryRecord = {
  id: string
  kind: SummaryKind
  dateKey: string
  title: string
  content: Record<string, string>
}

type SummaryRow = {
  id: string
  kind: string | null
  period_start: string | null
  title: string | null
  content: unknown
}

function toDateKey(value: string | null): string {
  if (!value) return ''
  // timestamptz 序列化成 ISO，取前 10 位即本地日期的近似值
  return value.slice(0, 10)
}

function normalizeContent(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {}

  const result: Record<string, string> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (item === null || item === undefined) continue
    result[key] = typeof item === 'string' ? item : String(item)
  }
  return result
}

function mapRow(row: SummaryRow): SummaryRecord {
  return {
    id: row.id,
    kind: (row.kind as SummaryKind) ?? 'daily',
    dateKey: toDateKey(row.period_start),
    title: row.title ?? '',
    content: normalizeContent(row.content)
  }
}

export async function listSummaries(kind: SummaryKind): Promise<SummaryRecord[]> {
  const rows = await apiRequest<SummaryRow[]>('/summaries', { query: { kind } })
  return rows.map(mapRow)
}

export async function getSummaryByDate(dateKey: string, kind: SummaryKind): Promise<SummaryRecord | null> {
  const row = await apiRequest<SummaryRow | null>('/summaries/by-date', {
    query: { date: dateKey, kind }
  })

  return row ? mapRow(row) : null
}

export type SummaryInput = {
  kind: SummaryKind
  dateKey: string
  title: string
  content: Record<string, string>
}

export async function createSummary(input: SummaryInput): Promise<SummaryRecord> {
  const row = await apiRequest<SummaryRow>('/summaries', {
    method: 'POST',
    body: {
      kind: input.kind,
      period_start: input.dateKey,
      period_end: input.dateKey,
      title: input.title,
      content: input.content
    }
  })

  return mapRow(row)
}

export async function updateSummary(summaryId: string, input: Omit<SummaryInput, 'kind'>) {
  const row = await apiRequest<SummaryRow>(`/summaries/${summaryId}`, {
    method: 'PATCH',
    body: {
      period_start: input.dateKey,
      period_end: input.dateKey,
      title: input.title,
      content: input.content
    }
  })

  return mapRow(row)
}

export async function deleteSummary(summaryId: string): Promise<void> {
  await apiRequest(`/summaries/${summaryId}`, { method: 'DELETE' })
}
