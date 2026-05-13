/**
 * ============================================
 * 习惯数据表操作 (services/db/habits.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 habits 表的 CRUD 操作
 * - 支持习惯打卡记录管理
 *
 * 【frequency 约定】
 * - daily:   { type: 'daily' }
 * - weekly:  { type: 'weekly', weekdays: [1, 3, 5] }
 * - monthly: { type: 'monthly', monthDays: [1, 15, 28] }
 * - 老数据缺失 frequency 时，运行时按 daily 兼容
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
import { TABLES } from './tables'

const supabase = client.createBase(TABLES.HABIT)

/**
 * 习惯管理模块
 * 提供 habits 表和 habit_logs 表的 CRUD 操作封装
 */
export const habit = {
    /**
     * 查询所有习惯列表
     * @returns {Promise<Array>} 习惯列表，按创建时间升序排列
     */
    async list() {
        return await supabase.query(q => q
            .select('*')
            .order('created_at', { ascending: true })
        )
    },

    /**
     * 查询所有习惯列表（轻量版，用于下拉选择等场景）
     * @returns {Promise<Array>} 习惯列表，按创建时间升序排列
     */
    async listLite() {
        return await supabase.query(q => q
            .select('*')
            .order('created_at', { ascending: true })
        )
    },

    /**
     * 查询指定日期范围内的打卡记录
     * @param {Date} startDate - 开始日期
     * @param {Date} endDate - 结束日期
     * @returns {Promise<Array>} 打卡记录列表
     */
    async listLogsByDate(startDate, endDate) {
        return await trackGlobalLoading(async () => {
            const { data, error } = await client
                .from(TABLES.HABIT_LOGS)
                .select('*')
                .gte('completed_at', startDate.toISOString())
                .lte('completed_at', endDate.toISOString())

            if (error) throw error
            return data
        })
    },

    /**
     * 查询指定习惯的所有打卡记录
     * @param {string|number} habitId - 习惯 ID
     * @returns {Promise<Array>} 打卡记录列表，按完成时间升序排列
     */
    async listLogsByHabit(habitId) {
        return await trackGlobalLoading(async () => {
            const { data, error } = await client
                .from(TABLES.HABIT_LOGS)
                .select('*')
                .eq('habit_id', habitId)
                .order('completed_at', { ascending: true })

            if (error) throw error
            return data
        })
    },

    /**
     * 查询指定年份的所有打卡记录
     * @param {number} year - 年份（如 2026）
     * @returns {Promise<Array>} 打卡记录列表，按完成时间升序排列
     */
    async listLogsByYear(year) {
        return await trackGlobalLoading(async () => {
            const startDate = new Date(year, 0, 1).toISOString()
            const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString()
            const { data, error } = await client
                .from(TABLES.HABIT_LOGS)
                .select('*')
                .gte('completed_at', startDate)
                .lte('completed_at', endDate)
                .order('completed_at', { ascending: true })

            if (error) throw error
            return data
        })
    },

    /**
     * 创建新习惯
     * @param {Object} habit - 习惯数据对象
     * @returns {Promise<Object>} 创建成功的习惯记录
     */
    async create(habit) {
        return await supabase.create(habit)
    },

    /**
     * 更新习惯信息
     * @param {string|number} id - 习惯 ID
     * @param {Object} updates - 要更新的字段
     * @returns {Promise<Object>} 更新后的习惯记录
     */
    async update(id, updates) {
        return await supabase.update(id, updates)
    },

    /**
     * 删除习惯
     * @param {string|number} id - 习惯 ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        return await supabase.delete(id)
    },

    /**
     * 习惯打卡
     * @param {string|number} habitId - 习惯 ID
     * @param {string} [log=''] - 打卡日志/备注
     * @param {Date|null} [completedAt=null] - 打卡时间（为 null 时使用当前时间）
     * @returns {Promise<Object>} 创建的打卡记录
     */
    async log(habitId, log = '', completedAt = null) {
        return await trackGlobalLoading(async () => {
            const payload = {
                habit_id: habitId,
                log
            }
            if (completedAt) {
                payload.completed_at = completedAt
            }
            const { data, error } = await client.from(TABLES.HABIT_LOGS).insert(payload).select().single()
            if (error) throw error
            return data
        })
    },

    /**
     * 删除打卡记录（取消打卡）
     * @param {string|number} logId - 打卡记录 ID
     * @returns {Promise<void>}
     */
    async deleteLog(logId) {
        return await trackGlobalLoading(async () => {
            const { error } = await client.from(TABLES.HABIT_LOGS).delete().eq('id', logId)
            if (error) throw error
        })
    }
}
