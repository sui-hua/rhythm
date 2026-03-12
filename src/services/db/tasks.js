import supabaseClient, { createBaseSupabase } from '@/config/supabase'

const supabase = createBaseSupabase('tasks')

export const tasks = {
    async list(start, end) {
        let query = supabaseClient.from('tasks').select('*').order('start_time', { ascending: true })
        // If start/end provided, filter. Assuming start_time is used for filtering day view.
        if (start) query = query.gte('start_time', start.toISOString())
        if (end) query = query.lte('start_time', end.toISOString())

        const { data, error } = await query
        if (error) throw error
        return data
    },
    async create(task) {
        return await supabase.create(task)
    },
    async update(id, updates) {
        return await supabase.update(id, updates)
    },
    async delete(id) {
        return await supabase.delete(id)
    }
}
