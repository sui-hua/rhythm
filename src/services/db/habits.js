import supabase from '@/config/supabase'

export const habits = {
    async list() {
        // Fetch habits and their logs
        const { data, error } = await supabase
            .from('habits')
            .select('*, habit_logs(*)')
            .order('created_at', { ascending: true })
        if (error) throw error
        return data
    },
    async create(habit) {
        const { data, error } = await supabase.from('habits').insert(habit).select().single()
        if (error) throw error
        return data
    },
    async update(id, updates) {
        const { data, error } = await supabase.from('habits').update(updates).eq('id', id).select().single()
        if (error) throw error
        return data
    },
    async delete(id) {
        const { error } = await supabase.from('habits').delete().eq('id', id)
        if (error) throw error
    },
    async log(habitId, log = '') {
        const { data, error } = await supabase.from('habit_logs').insert({
            habit_id: habitId,
            log
        }).select().single()
        if (error) throw error
        return data
    },
    async deleteLog(logId) {
        const { error } = await supabase.from('habit_logs').delete().eq('id', logId)
        if (error) throw error
    }
}
