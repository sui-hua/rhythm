/**
 * ============================================
 * 习惯数据表操作 (services/db/habits.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 habits 表的 CRUD 操作
 * - 支持习惯打卡记录管理
 *
 * 【方法说明】
 * - list()           → 查询所有习惯（不含打卡记录）
 * - listLite()      → 查询所有习惯（不含打卡记录，用于下拉选择）
 * - listLogsByDate()→ 查询指定日期范围内的打卡记录
 * - listLogsByHabit()→ 查询指定习惯的所有打卡记录
 * - create()         → 创建新习惯
 * - update()        → 更新习惯信息
 * - delete()        → 删除习惯
 * - log()           → 习惯打卡
 * - deleteLog()     → 取消打卡记录
 */
import client from '@/config/supabase'
import { trackGlobalLoading } from '@/composables/useGlobalLoading'

const supabase = client.createBase('habits')

export const habits = {
    async list() {
        return await supabase.query(q => q
            .select('*')
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
    async listLogsByHabit(habitId) {
        return await trackGlobalLoading(async () => {
            const { data, error } = await client
                .from('habit_logs')
                .select('*')
                .eq('habit_id', habitId)
                .order('completed_at', { ascending: true })

            if (error) throw error
            return data
        })
    },
    async listLogsByYear(year) {
        return await trackGlobalLoading(async () => {
            const startDate = new Date(year, 0, 1).toISOString()
            const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString()
            const { data, error } = await client
                .from('habit_logs')
                .select('*')
                .gte('completed_at', startDate)
                .lte('completed_at', endDate)
                .order('completed_at', { ascending: true })

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
