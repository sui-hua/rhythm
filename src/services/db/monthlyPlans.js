import supabaseClient, { createBaseSupabase } from '@/config/supabase'

const supabase = createBaseSupabase('monthly_plans')

export const monthlyPlans = {
    async list(planId) {
        // List monthly plans; ordered by month (DATE column stores month first day; year stored on parent plan as DATE)
        let query = supabaseClient.from('monthly_plans').select('*').order('month', { ascending: true })
        if (planId) query = query.eq('plan_id', planId)
        const { data, error } = await query
        if (error) throw error
        return data
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
