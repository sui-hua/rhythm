import client from '@/config/supabase'

const supabase = client.createBase('tasks')

export const tasks = {
    async list(start, end) {
        return await supabase.query(q => {
            let query = q.select('*').order('start_time', { ascending: true })
            if (start) query = query.gte('start_time', start.toISOString())
            if (end) query = query.lte('start_time', end.toISOString())
            return query
        })
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
