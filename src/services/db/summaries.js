import client from '@/config/supabase'
import { trackGlobalLoading } from '@/composables/useGlobalLoading'
import { mapSummaryRowToRecord } from '@/views/summary/utils/summaryAdapters'

const table = 'summaries'
const allowedScopes = new Set(['year', 'quarter', 'month', 'week'])
const kindToLegacyScope = {
  daily: 'week',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year'
}

const normalizeScope = (scope) => {
  if (scope === 'day') return 'week'
  return allowedScopes.has(scope) ? scope : null
}

const bridgeLegacyScope = (payload) => {
  if (!payload || typeof payload !== 'object') return payload

  const legacyScope = normalizeScope(payload.scope) ?? kindToLegacyScope[payload.kind]
  if (!legacyScope) return payload

  return {
    ...payload,
    scope: legacyScope
  }
}

const persistSummary = async (payload) => {
  const bridgedPayload = bridgeLegacyScope(payload)
  const query = payload.id
    ? client.from(table).update(bridgedPayload).eq('id', payload.id)
    : client.from(table).insert(bridgedPayload)

  const { data, error } = await query.select().single()

  if (error) throw error
  return mapSummaryRowToRecord(data)
}

export const summaries = {
  async listByKind(kind) {
    return await trackGlobalLoading(async () => {
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq('kind', kind)
        .order('period_start', { ascending: false })

      if (error) throw error
      return (data || []).map(mapSummaryRowToRecord)
    })
  },

  async save(payload) {
    return await trackGlobalLoading(async () => persistSummary(payload))
  },

  async remove(id) {
    return await trackGlobalLoading(async () => {
      const { error } = await client.from(table).delete().eq('id', id)
      if (error) throw error
    })
  }
}
