import client from '@/config/supabase'

const supabase = client.createBase('monthly_plans')

export const monthlyPlans = {
    async list(planId) {
        return await supabase.query(q => {
            let query = q.select('*').order('month', { ascending: true })
            if (planId) query = query.eq('plan_id', planId)
            return query
        })
    },
    async create(plan) {
        return await supabase.create(plan)
    },
    async update(id, updates) {
        return await supabase.update(id, updates)
    },
    async delete(id) {
        return await supabase.delete(id)
    }
}
