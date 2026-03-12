import client from '@/config/supabase'

const supabase = client.createBase('summaries')

export const summaries = {
    async list(scope) {
        return await supabase.query(q => {
            let query = q.select('*').order('created_at', { ascending: false })
            if (scope) query = query.eq('scope', scope)
            return query
        })
    },
    async create(summary) {
        return await supabase.create(summary)
    },
    async update(id, updates) {
        return await supabase.update(id, updates)
    },
    async delete(id) {
        return await supabase.delete(id)
    },
    async listDaily() {
        const { data, error } = await client.from('daily_summaries').select('*').order('created_at', { ascending: false })
        if (error) throw error
        return data
    },
    async getDaily(date) {
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const { data, error } = await client
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
            const { data, error } = await client.from('daily_summaries').update(summary).eq('id', summary.id).select().single()
            if (error) throw error
            return data
        } else {
            const { data, error } = await client.from('daily_summaries').insert(summary).select().single()
            if (error) throw error
            return data
        }
    },
    async deleteDaily(id) {
        const { error } = await client.from('daily_summaries').delete().eq('id', id)
        if (error) throw error
    }
}
