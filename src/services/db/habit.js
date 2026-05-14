import client from '@/config/supabase'
import { trackGlobalLoading } from '@/composables/useGlobalLoading'
import { TABLES } from './tables'

const supabase = client.createBase(TABLES.HABIT)

export const habit = {
    async list() {
        return await supabase.query(q => q
            .select('*')
            .order('created_at', { ascending: true })
        )
    },

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
