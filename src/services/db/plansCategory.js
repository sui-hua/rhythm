import supabaseClient, { createBaseSupabase } from '@/config/supabase'

const supabase = createBaseSupabase('plans_category')

export const plansCategory = {
    async list() {
        const { data, error } = await supabaseClient
            .from('plans_category')
            .select('*')
            .order('name', { ascending: true })
        if (error) throw error
        return data
    },
    async create(category) {
        return await supabase.create(category)
    },
    async update(id, updates) {
        return await supabase.update(id, updates)
    },
    async delete(id) {
        return await supabase.delete(id)
    }
}
