import supabase from '@/config/supabase'

export const plansCategory = {
    async list() {
        const { data, error } = await supabase
            .from('plans_category')
            .select('*')
            .order('name', { ascending: true })
        if (error) throw error
        return data
    },
    async create(category) {
        const { data, error } = await supabase.from('plans_category').insert(category).select().single()
        if (error) throw error
        return data
    },
    async update(id, updates) {
        const { data, error } = await supabase.from('plans_category').update(updates).eq('id', id).select().single()
        if (error) throw error
        return data
    },
    async delete(id) {
        const { error } = await supabase.from('plans_category').delete().eq('id', id)
        if (error) throw error
    }
}
