// goal table operations (top level of goal → goal_months → goal_days)
import client from '@/config/supabase'
import { TABLES } from './tables'

const base = client.createBase(TABLES.GOAL)

export const goal = {
    async list() {
        return await base.query(q => q
            .select('*, goal_categories(id, name)')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
        )
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
