/**
 * ============================================
 * 任务数据表操作 (services/db/tasks.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 tasks 表的 CRUD 操作
 * - 每日具体任务管理
 *
 * 【方法说明】
 * - list(start, end) → 按时间范围查询任务
 * - create()         → 创建新任务
 * - update()         → 更新任务信息
 * - delete()         → 删除任务
 */
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
