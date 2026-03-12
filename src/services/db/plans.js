import supabaseClient, { createBaseSupabase } from '@/config/supabase'

const supabase = createBaseSupabase('plans')

export const plans = {
    async list() {
        const { data, error } = await supabaseClient
            .from('plans')
            .select('*, plans_category(id, name)')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
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
