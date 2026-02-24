import supabase from '@/config/supabase'

export const summaries = {
    async list(scope) {
        let query = supabase.from('summaries').select('*').order('created_at', { ascending: false })
        if (scope) query = query.eq('scope', scope)
        const { data, error } = await query
        if (error) throw error
        return data
    },
    async create(summary) {
        const { data, error } = await supabase.from('summaries').insert(summary).select().single()
        if (error) throw error
        return data
    },
    async update(id, updates) {
        const { data, error } = await supabase.from('summaries').update(updates).eq('id', id).select().single()
        if (error) throw error
        return data
    },
    async delete(id) {
        const { error } = await supabase.from('summaries').delete().eq('id', id)
        if (error) throw error
    },
    async listDaily() {
        const { data, error } = await supabase.from('daily_summaries').select('*').order('created_at', { ascending: false })
        if (error) throw error
        return data
    },
    async getDaily(date) {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
            .from('daily_summaries')
            .select('*')
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString())
            .maybeSingle()

        if (error) throw error
        return data
    },
    async saveDaily(summary) {
        // Upsert logic if ID exists, or insert if new. 
        // For simplicity, just insert or update based on passed data.
        if (summary.id) {
            const { data, error } = await supabase.from('daily_summaries').update(summary).eq('id', summary.id).select().single()
            if (error) throw error
            return data
        } else {
            const { data, error } = await supabase.from('daily_summaries').insert(summary).select().single()
            if (error) throw error
            return data
        }
    },
    async deleteDaily(id) {
        const { error } = await supabase.from('daily_summaries').delete().eq('id', id)
        if (error) throw error
    }
}
