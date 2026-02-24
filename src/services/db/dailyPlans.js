import supabase from '@/config/supabase'

export const dailyPlans = {
    async list(monthlyPlanId) {
        let query = supabase.from('daily_plans').select('*').order('day', { ascending: true })
        if (monthlyPlanId) query = query.eq('monthly_plan_id', monthlyPlanId)
        const { data, error } = await query
        if (error) throw error
        return data
    },
    async create(plan) {
        const { data, error } = await supabase.from('daily_plans').insert(plan).select().single()
        if (error) throw error
        return data
    },
    async update(id, updates) {
        const { data, error } = await supabase.from('daily_plans').update(updates).eq('id', id).select().single()
        if (error) throw error
        return data
    },
    async delete(id) {
        const { error } = await supabase.from('daily_plans').delete().eq('id', id)
        if (error) throw error
    },
    async listByDate(date) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`

        const { data, error } = await supabase.from('daily_plans').select('*').eq('date', dateStr)
        if (error) throw error
        return data
    }
}
