import supabase from '@/config/supabase'

export const plans = {
    async list() {
        const { data, error } = await supabase
            .from('plans')
            .select('*, plans_category(id, name)')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
        if (error) throw error
        return data
    },
    async create(plan) {
        const { data, error } = await supabase.from('plans').insert(plan).select().single()
        if (error) throw error
        return data
    },
    async update(id, updates) {
        const { data, error } = await supabase.from('plans').update(updates).eq('id', id).select().single()
        if (error) throw error
        return data
    },
    async delete(id) {
        const { error } = await supabase.from('plans').delete().eq('id', id)
        if (error) throw error
    }
}
