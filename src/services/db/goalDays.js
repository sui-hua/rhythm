/**
 * ============================================
 * 日计划数据表操作 (services/db/goalDays.js)
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
 * import { goalDays } from '@/services/db/goalDays'
 *
 * // 查询某月度计划下的所有日计划
 * const { data } = await goalDays.list('monthly-plan-uuid')
 *
 * // 按日期查询（返回完整三级关联数据）
 * const { data } = await goalDays.listByDate(new Date('2026-04-20'))
 */
import client from '@/config/supabase'
import { TABLES } from './tables'

const supabase = client.createBase(TABLES.GOAL_DAYS)
const plansBase = client.createBase(TABLES.GOAL)

const toDateOnly = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const subtractDays = (date, days) => {
    const next = new Date(date)
    next.setDate(next.getDate() - days)
    return next
}

async function getMaxCarryOverLookbackDays() {
    const rows = await plansBase.query(q => q
        .select('carry_over_lookback_days')
        .gt('carry_over_lookback_days', 0)
        .order('carry_over_lookback_days', { ascending: false })
        .limit(1)
    )

    return Number(rows?.[0]?.carry_over_lookback_days || 0)
}

export const goalDays = {
    /**
     * 按月度计划 ID 查询日计划列表
     * @description 查询指定月度计划下的所有日计划，按 day 字段升序排列
     * @param {string|null} monthlyPlanId - 月度计划 ID，为空则返回所有日计划
     * @returns {Promise<{data: Array, error: object|null}>} 日计划列表
     */
    async list(monthlyPlanId) {
        return await supabase.query(q => {
            let query = q.select('*').order('day', { ascending: true })
            if (monthlyPlanId) query = query.eq('goal_month_id', monthlyPlanId)
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
     * 批量删除日计划，避免选中多天时逐条发起删除请求。
     * @param {string[]} ids - 日计划 ID 列表
     * @returns {Promise<Array>} 删除结果
     */
    async deleteByIds(ids) {
        if (!Array.isArray(ids) || ids.length === 0) return []

        return await supabase.query(q => q
            .delete()
            .in('id', ids)
        )
    },

    /**
     * 按日期查询日计划，包含完整的关联数据（三级级联）
     * 查询路径：daily_plans → monthly_plans → plans
     * @param {Date} date - 要查询的日期对象
     * @returns {Promise<{data: Array, error: object|null}>} 日计划列表及其关联的月度计划和上级目标信息
     */
    async listByDate(date) {
        const dateStr = toDateOnly(date)

        return await supabase.query(q => q
            .select(`
                *,
                goal_months (
                    id,
                    task_time,
                    duration,
                    goal (
                        id,
                        task_time,
                        duration
                    )
                )
            `)
            .eq('day', dateStr)
        )
    },

    /**
     * Day 页面专用查询：
     * 1. 保留当天原始 daily_plans
     * 2. 只读补查目标配置窗口内的历史未完成项
     * 3. 不改写 daily_plans.day，只在读取层把它们一起带出来
     * @param {Date} date - Day 页面当前查看的日期
     * @returns {Promise<Array>} 当天项与历史未完成项的合并结果
     */
    async listForDayView(date) {
        const targetDateStr = toDateOnly(date)
        const maxLookbackDays = await getMaxCarryOverLookbackDays()

        if (maxLookbackDays === 0) {
            return await this.listByDate(date)
        }

        const earliestDateStr = toDateOnly(subtractDays(date, maxLookbackDays))
        const rows = await supabase.query(q => q
            .select(`
                *,
                goal_months (
                    id,
                    task_time,
                    duration,
                    goal (
                        id,
                        task_time,
                        duration,
                        carry_over_lookback_days
                    )
                )
            `)
            .gte('day', earliestDateStr)
            .lte('day', targetDateStr)
            .order('day', { ascending: true })
        )

        return (rows || []).filter((plan) => {
            if (plan.day === targetDateStr) return true
            if (plan.status !== 0) return false

            const lookbackDays = Number(plan.goal_months?.goal?.carry_over_lookback_days || 0)
            if (lookbackDays <= 0) return false

            // 每个目标只在自己的窗口内回看历史未完成项，避免把更久之前的积压任务误带到今天。
            const earliestAllowed = subtractDays(date, lookbackDays)
            const planDate = new Date(`${plan.day}T00:00:00`)
            return planDate >= earliestAllowed && plan.day < targetDateStr
        })
    }
}
