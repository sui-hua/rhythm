import client from '@/config/supabase'

const supabase = client.createBase('daily_plans')

export const dailyPlans = {
    async list(monthlyPlanId) {
        return await supabase.query(q => {
            let query = q.select('*').order('day', { ascending: true })
            if (monthlyPlanId) query = query.eq('monthly_plan_id', monthlyPlanId)
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
    },
    async listByDate(date) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`

        return await supabase.query(q => q
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
        )
    }
}
