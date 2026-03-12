import client from '@/config/supabase'

const supabase = client.createBase('plans')

export const plans = {
    async list() {
        return await supabase.query(q => q
            .select('*, plans_category(id, name)')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
        )
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
