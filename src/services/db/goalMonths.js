// goal_months table operations (second level of goal → goal_months → goal_days)
import client from '@/config/supabase'
import { TABLES } from './tables'

const base = client.createBase(TABLES.GOAL_MONTHS)

export const goalMonths = {
    async list(goalId) {
        return await base.query(q => {
            let query = q.select('*').order('month', { ascending: true })
            if (goalId) query = query.eq('goal_id', goalId)
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
    }
}
