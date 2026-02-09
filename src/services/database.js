import supabase from '@/config/supabase'

export const db = {
  // Plans (总计划)
  plans: {
    async list() {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
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
  },

  // Monthly Plans (月计划)
  monthlyPlans: {
    async list(planId) {
      // List monthly plans; ordered by month (DATE column stores month first day; year stored on parent plan as DATE)
      let query = supabase.from('monthly_plans').select('*').order('month', { ascending: true })
      if (planId) query = query.eq('plan_id', planId)
      const { data, error } = await query
      if (error) throw error
      return data
    },
    async create(plan) {
      const { data, error } = await supabase.from('monthly_plans').insert(plan).select().single()
      if (error) throw error
      return data
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('monthly_plans').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    async delete(id) {
      const { error } = await supabase.from('monthly_plans').delete().eq('id', id)
      if (error) throw error
    }
  },

  // Daily Plans (日计划)
  dailyPlans: {
    async list(monthlyPlanId) {
      let query = supabase.from('daily_plans').select('*').order('day', { ascending: true })
      if (monthlyPlanId) query = query.eq('monthly_plan_id', monthlyPlanId)
      const { data, error } = await query
      if (error) throw error
      return data
    },
    async create(plan) {
      const { data, error } = await supabase.from('daily_plans').insert(plan).select().single()
      if (error) throw error
      return data
    },
    async update(id, updates) {
      const { data, error } = await supabase.from('daily_plans').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    async delete(id) {
      const { error } = await supabase.from('daily_plans').delete().eq('id', id)
      if (error) throw error
    }
  },

  // Habits (习惯)
  habits: {
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
    async log(habitId, log = '', date = new Date()) {
      const { data, error } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        log,
        completed_at: date
      }).select().single()
      if (error) throw error
      return data
    },
    async deleteLog(logId) {
        const { error } = await supabase.from('habit_logs').delete().eq('id', logId)
        if (error) throw error
    }
  },

  // Tasks (任务)
  tasks: {
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
  },

  // Summaries (总结)
  summaries: {
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
        startOfDay.setHours(0,0,0,0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23,59,59,999)
        
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
}
