/**
 * ============================================
 * 日计划数据表操作 (services/db/dailyPlans.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 daily_plans 表的 CRUD 操作
 * - 日计划属于月度计划的下级（三级级联第三级）
 *
 * 【三级级联结构】
 *   plans (一级: 目标/计划)
 *     └─ monthly_plans (二级: 月度计划)
 *          └─ daily_plans (三级: 日计划)
 *
 * 【字段说明】
 * - id: 主键 UUID
 * - monthly_plan_id: 关联的月度计划 ID (外键)
 * - day: 计划日期，格式 YYYY-MM-DD
 * - task_time: 计划执行时间，格式 HH:mm
 * - duration: 预计时长（分钟）
 * - content: 计划内容描述
 * - created_at/updated_at: 时间戳（由 Supabase 自动管理）
 *
 * 【方法说明】
 * - list(monthlyPlanId)    → 按月度计划查询日计划列表
 * - create()               → 创建日计划
 * - update()               → 更新日计划信息
 * - delete()               → 删除日计划
 * - listByDate()           → 按日期查询日计划（包含关联的月度计划和上级目标信息）
 *
 * 【使用示例】
 * import { dailyPlans } from '@/services/db/dailyPlans'
 *
 * // 查询某月度计划下的所有日计划
 * const { data } = await dailyPlans.list('monthly-plan-uuid')
 *
 * // 按日期查询（返回完整三级关联数据）
 * const { data } = await dailyPlans.listByDate(new Date('2026-04-20'))
 */
import client from '@/config/supabase'

const supabase = client.createBase('daily_plans')

export const dailyPlans = {
    /**
     * 按月度计划 ID 查询日计划列表
     * @description 查询指定月度计划下的所有日计划，按 day 字段升序排列
     * @param {string|null} monthlyPlanId - 月度计划 ID，为空则返回所有日计划
     * @returns {Promise<{data: Array, error: object|null}>} 日计划列表
     */
    async list(monthlyPlanId) {
        return await supabase.query(q => {
            let query = q.select('*').order('day', { ascending: true })
            if (monthlyPlanId) query = query.eq('monthly_plan_id', monthlyPlanId)
            return query
        })
    },

    /**
     * 创建新的日计划
     * @param {object} plan - 日计划数据对象
     * @param {string} [plan.monthly_plan_id] - 关联的月度计划 ID
     * @param {string} [plan.day] - 计划日期，格式 YYYY-MM-DD
     * @param {string} [plan.task_time] - 计划时间 HH:mm
     * @param {number} [plan.duration] - 预计时长（分钟）
     * @param {string} [plan.content] - 计划内容描述
     * @returns {Promise<{data: object, error: object|null}>} 创建的日计划记录
     */
    async create(plan) {
        return await supabase.create(plan)
    },

    /**
     * 更新指定日计划
     * @param {string} id - 日计划 ID
     * @param {object} updates - 要更新的字段
     * @param {string} [updates.day] - 计划日期
     * @param {string} [updates.task_time] - 计划时间
     * @param {number} [updates.duration] - 预计时长
     * @param {string} [updates.content] - 计划内容
     * @returns {Promise<{data: object, error: object|null}>} 更新后的日计划记录
     */
    async update(id, updates) {
        return await supabase.update(id, updates)
    },

    /**
     * 删除指定的日计划
     * @param {string} id - 日计划 ID
     * @returns {Promise<{data: object, error: object|null}>} 删除结果
     */
    async delete(id) {
        return await supabase.delete(id)
    },

    /**
     * 按日期查询日计划，包含完整的关联数据（三级级联）
     * 查询路径：daily_plans → monthly_plans → plans
     * @param {Date} date - 要查询的日期对象
     * @returns {Promise<{data: Array, error: object|null}>} 日计划列表及其关联的月度计划和上级目标信息
     */
    async listByDate(date) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`

        return await supabase.query(q => q
            .select(`
                *,
                monthly_plans (
                    id,
                    task_time,
                    duration,
                    plans (
                        id,
                        task_time,
                        duration
                    )
                )
            `)
            .eq('day', dateStr)
        )
    }
}
