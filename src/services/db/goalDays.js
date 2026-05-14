// goal_days table operations (third level of goal → goal_months → goal_days)
import client from '@/config/supabase'
import { TABLES } from './tables'
import { toDateOnly } from '@/utils/dateFormatter'

const base = client.createBase(TABLES.GOAL_DAYS)
const goalsBase = client.createBase(TABLES.GOAL)

const subtractDays = (date, days) => {
    const next = new Date(date)
    next.setDate(next.getDate() - days)
    return next
}

async function getMaxCarryOverLookbackDays() {
    const rows = await goalsBase.query(q => q
        .select('carry_over_lookback_days')
        .gt('carry_over_lookback_days', 0)
        .order('carry_over_lookback_days', { ascending: false })
        .limit(1)
    )

    return Number(rows?.[0]?.carry_over_lookback_days || 0)
}

export const goalDays = {
    async list(monthPlanId) {
        return await base.query(q => {
            let query = q.select('*').order('day', { ascending: true })
            if (monthPlanId) query = query.eq('goal_month_id', monthPlanId)
            return query
        })
    },

    async create(payload) {
        return await base.create(payload)
    },

    async update(id, updates) {
        return await base.update(id, updates)
    },

    async delete(id) {
        return await base.delete(id)
    },

    async deleteByIds(ids) {
        if (!Array.isArray(ids) || ids.length === 0) return []

        return await base.query(q => q
            .delete()
            .in('id', ids)
        )
    },

    async listByDate(date) {
        const dateStr = toDateOnly(date)

        return await base.query(q => q
            .select(`
                *,
                goal_months (
                    id,
                    task_time,
                    duration,
                    goal (
                        id,
                        task_time,
                        duration
                    )
                )
            `)
            .eq('day', dateStr)
        )
    },

    async listForDayView(date) {
        const targetDateStr = toDateOnly(date)
        const maxLookbackDays = await getMaxCarryOverLookbackDays()

        if (maxLookbackDays === 0) {
            return await this.listByDate(date)
        }

        const earliestDateStr = toDateOnly(subtractDays(date, maxLookbackDays))
        const rows = await base.query(q => q
            .select(`
                *,
                goal_months (
                    id,
                    task_time,
                    duration,
                    goal (
                        id,
                        task_time,
                        duration,
                        carry_over_lookback_days
                    )
                )
            `)
            .gte('day', earliestDateStr)
            .lte('day', targetDateStr)
            .order('day', { ascending: true })
        )

        return (rows || []).filter((item) => {
            if (item.day === targetDateStr) return true
            if (item.status !== 0) return false

            const lookbackDays = Number(item.goal_months?.goal?.carry_over_lookback_days || 0)
            if (lookbackDays <= 0) return false

            const earliestAllowed = subtractDays(date, lookbackDays)
            const itemDate = new Date(`${item.day}T00:00:00`)
            return itemDate >= earliestAllowed && item.day < targetDateStr
        })
    }
}
