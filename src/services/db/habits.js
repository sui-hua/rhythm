import supabaseClient, { createBaseSupabase } from '@/config/supabase'

const supabase = createBaseSupabase('habits')

export const habits = {
    async list() {
        // Fetch habits and their logs
        const { data, error } = await supabaseClient
            .from('habits')
            .select('*, habit_logs(*)')
            .order('created_at', { ascending: true })
        if (error) throw error
        return data
    },
    async create(habit) {
        return await supabase.create(habit)
    },
    async update(id, updates) {
        return await supabase.update(id, updates)
    },
    async delete(id) {
        return await supabase.delete(id)
    },
    async log(habitId, log = '', completedAt = null) {
        const payload = {
            habit_id: habitId,
            log
        }
        if (completedAt) {
            payload.completed_at = completedAt
        }
        const { data, error } = await supabaseClient.from('habit_logs').insert(payload).select().single()
        if (error) throw error
        return data
    },
    async deleteLog(logId) {
        const { error } = await supabaseClient.from('habit_logs').delete().eq('id', logId)
        if (error) throw error
    }
}
