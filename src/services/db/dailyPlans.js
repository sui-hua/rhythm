import supabaseClient, { createBaseSupabase } from '@/config/supabase'

const supabase = createBaseSupabase('daily_plans')

export const dailyPlans = {
    async list(monthlyPlanId) {
        let query = supabaseClient.from('daily_plans').select('*').order('day', { ascending: true })
        if (monthlyPlanId) query = query.eq('monthly_plan_id', monthlyPlanId)
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
    },
    async listByDate(date) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`

        const { data, error } = await supabaseClient
            .from('daily_plans')
            .select(`
                *,
                monthly_plans (
                    id,
                    task_time,
                    duration,
                    plans (
                        id,
                        task_time,
                        duration
                    )
                )
            `)
            .eq('date', dateStr)
        if (error) throw error
        return data
    }
}
