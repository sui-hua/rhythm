import supabase from '@/config/supabase'

export const tasks = {
    async list(start, end) {
        let query = supabase.from('tasks').select('*').order('start_time', { ascending: true })
        // If start/end provided, filter. Assuming start_time is used for filtering day view.
        if (start) query = query.gte('start_time', start.toISOString())
        if (end) query = query.lte('start_time', end.toISOString())

        const { data, error } = await query
        if (error) throw error
        return data
    },
    async create(task) {
        const { data, error } = await supabase.from('tasks').insert(task).select().single()
        if (error) throw error
        return data
    },
    async update(id, updates) {
        const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single()
        if (error) throw error
        return data
    },
    async delete(id) {
        const { error } = await supabase.from('tasks').delete().eq('id', id)
        if (error) throw error
    }
}
