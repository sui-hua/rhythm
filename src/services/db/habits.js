import client from '@/config/supabase'
import { trackGlobalLoading } from '@/composables/useGlobalLoading'

const supabase = client.createBase('habits')

export const habits = {
    async list() {
        return await supabase.query(q => q
            .select('*, habit_logs(*)')
            .order('created_at', { ascending: true })
        )
    },
    async listLite() {
        return await supabase.query(q => q
            .select('*')
            .order('created_at', { ascending: true })
        )
    },
    async listLogsByDate(startDate, endDate) {
        return await trackGlobalLoading(async () => {
            const { data, error } = await client
                .from('habit_logs')
                .select('*')
                .gte('completed_at', startDate.toISOString())
                .lte('completed_at', endDate.toISOString())

            if (error) throw error
            return data
        })
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
        return await trackGlobalLoading(async () => {
            const payload = {
                habit_id: habitId,
                log
            }
            if (completedAt) {
                payload.completed_at = completedAt
            }
            const { data, error } = await client.from('habit_logs').insert(payload).select().single()
            if (error) throw error
            return data
        })
    },
    async deleteLog(logId) {
        return await trackGlobalLoading(async () => {
            const { error } = await client.from('habit_logs').delete().eq('id', logId)
            if (error) throw error
        })
    }
}
