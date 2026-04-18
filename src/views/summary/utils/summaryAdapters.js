import { buildDefaultPeriod } from '@/views/summary/utils/summaryPeriods'

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const normalizeContent = (content) => {
  if (typeof content === 'string') {
    return { text: content }
  }

  if (isPlainObject(content)) {
    return content
  }

  return {}
}

const normalizeMood = (mood) => {
  if (mood === '' || mood === null || mood === undefined) {
    return null
  }

  if (typeof mood === 'number') {
    return Number.isFinite(mood) ? mood : null
  }

  if (typeof mood === 'string') {
    const parsedMood = Number(mood.trim())
    return Number.isFinite(parsedMood) ? parsedMood : null
  }

  return null
}

const legacyScopeToKind = {
  day: 'daily',
  week: 'weekly',
  month: 'monthly',
  year: 'yearly'
}

const isUnifiedPayload = (summary) => (
  isPlainObject(summary)
  && typeof summary.kind === 'string'
  && typeof summary.period_start === 'string'
  && typeof summary.period_end === 'string'
  && Object.prototype.hasOwnProperty.call(summary, 'content')
)

const resolveKind = (summary) => {
  if (typeof summary.kind === 'string') return summary.kind
  if (typeof summary.scope === 'string') {
    const legacyKind = legacyScopeToKind[summary.scope]
    if (legacyKind) return legacyKind
    throw new Error(`Unsupported legacy summary scope: ${summary.scope}`)
  }

  throw new Error('Summary payload is missing kind')
}

const resolvePeriod = (summary, kind) => {
  if (typeof summary.period_start === 'string' && typeof summary.period_end === 'string') {
    return {
      periodStart: summary.period_start,
      periodEnd: summary.period_end
    }
  }

  return buildDefaultPeriod(kind, summary.created_at ? new Date(summary.created_at) : new Date())
}

const resolveFormData = (summary, kind) => {
  const content = normalizeContent(summary.content)
  const mood = normalizeMood(summary.mood ?? content.mood ?? null)

  if (kind === 'daily') {
    return {
      done: summary.done ?? content.done ?? '',
      improve: summary.improve ?? content.improve ?? '',
      tomorrow: summary.tomorrow ?? content.tomorrow ?? '',
      mood
    }
  }

  return {
    title: summary.title ?? '',
    text: summary.text ?? content.text ?? '',
    mood
  }
}

export const mapSummaryRowToRecord = (row) => ({
  id: row.id,
  user_id: row.user_id,
  kind: row.kind,
  period_start: row.period_start,
  period_end: row.period_end,
  title: row.title ?? null,
  content: normalizeContent(row.content),
  mood: normalizeMood(row.mood),
  created_at: row.created_at,
  updated_at: row.updated_at ?? row.created_at
})

export const buildSummaryPayload = ({ kind, userId, period, formData, existingRecord }) => {
  const isDaily = kind === 'daily'

  return {
    ...(existingRecord?.id ? { id: existingRecord.id } : {}),
    user_id: userId,
    kind,
    period_start: period.periodStart,
    period_end: period.periodEnd,
    title: isDaily ? null : (formData.title?.trim() || null),
    content: isDaily
      ? {
          done: formData.done || '',
          improve: formData.improve || '',
          tomorrow: formData.tomorrow || ''
        }
      : {
          text: formData.text || ''
        },
    mood: normalizeMood(formData.mood)
  }
}

export const toUnifiedSummaryPayload = (summary) => {
  if (isUnifiedPayload(summary)) {
    return {
      ...summary,
      content: normalizeContent(summary.content),
      mood: normalizeMood(summary.mood)
    }
  }

  const kind = resolveKind(summary)
  const period = resolvePeriod(summary, kind)
  const formData = resolveFormData(summary, kind)

  return buildSummaryPayload({
    kind,
    userId: summary.user_id ?? summary.userId,
    period,
    formData,
    existingRecord: summary.id ? { id: summary.id } : null
  })
}
