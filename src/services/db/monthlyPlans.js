import supabase from '@/config/supabase'

export const monthlyPlans = {
    async list(planId) {
        // List monthly plans; ordered by month (DATE column stores month first day; year stored on parent plan as DATE)
        let query = supabase.from('monthly_plans').select('*').order('month', { ascending: true })
        if (planId) query = query.eq('plan_id', planId)
        const { data, error } = await query
        if (error) throw error
        return data
    },
    async create(plan) {
        const { data, error } = await supabase.from('monthly_plans').insert(plan).select().single()
        if (error) throw error
        return data
    },
    async update(id, updates) {
        const { data, error } = await supabase.from('monthly_plans').update(updates).eq('id', id).select().single()
        if (error) throw error
        return data
    },
    async delete(id) {
        const { error } = await supabase.from('monthly_plans').delete().eq('id', id)
        if (error) throw error
    }
}
