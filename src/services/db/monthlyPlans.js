/**
 * ============================================
 * 月计划数据表操作 (services/db/monthlyPlans.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 monthly_plans 表的 CRUD 操作
 * - 月计划属于目标的下级，计划的上级（三级级联第二级）
 *
 * 【数据层级】
 * - goals (目标) → monthly_plans (月计划) → daily_plans (日计划)
 *
 * 【方法说明】
 * - list(planId)    → 按目标查询月计划列表
 * - create()        → 创建月计划
 * - update()        → 更新月计划信息
 * - delete()        → 删除月计划
 *
 * @module services/db/monthlyPlans
 * @author Rhythm Team
 * @since 2024
 */
import client from '@/config/supabase'

const supabase = client.createBase('monthly_plans')

export const monthlyPlans = {
    /**
     * 查询月计划列表
     * @description 根据目标ID查询该目标下的所有月计划，按月份升序排列
     * @param {string|null} planId - 目标ID（所属的计划/目标），传null则返回所有月计划
     * @returns {Promise<Array>} 月计划数组，按 month 字段升序排列
     * @throws {Error} 数据库查询失败时抛出异常
     * @example
     * // 查询某目标下的所有月计划
     * const plans = await monthlyPlans.list('goal_123')
     * // 返回 [{ id, plan_id, month, ... }, ...]
     */
    async list(planId) {
        return await supabase.query(q => {
            let query = q.select('*').order('month', { ascending: true })
            if (planId) query = query.eq('plan_id', planId)
            return query
        })
    },

    /**
     * 创建月计划
     * @description 向 monthly_plans 表插入一条新记录
     * @param {Object} plan - 月计划数据对象
     * @param {string} plan.plan_id - 所属目标ID（关联 goals 表）
     * @param {string} plan.month - 计划月份，格式：YYYY-MM
     * @param {string} [plan.title] - 月计划标题
     * @param {string} [plan.content] - 月计划内容/描述
     * @param {number} [plan.status] - 计划状态（0:未开始, 1:进行中, 2:已完成）
     * @returns {Promise<Object>} 包含创建记录的结果对象
     * @throws {Error} 数据插入失败时抛出异常
     * @example
     * const result = await monthlyPlans.create({
     *   plan_id: 'goal_123',
     *   month: '2024-03',
     *   title: '3月学习计划',
     *   content: '完成Vue3深入学习'
     * })
     */
    async create(plan) {
        return await supabase.create(plan)
    },

    /**
     * 更新月计划
     * @description 根据ID更新月计划的字段信息
     * @param {string} id - 月计划ID（primary key）
     * @param {Object} updates - 需要更新的字段对象
     * @param {string} [updates.title] - 月计划标题
     * @param {string} [updates.content] - 月计划内容
     * @param {number} [updates.status] - 计划状态
     * @returns {Promise<Object>} 包含更新结果的对象
     * @throws {Error} 数据更新失败时抛出异常
     * @example
     * await monthlyPlans.update('monthly_plan_456', {
     *   title: '更新后的标题',
     *   status: 1
     * })
     */
    async update(id, updates) {
        return await supabase.update(id, updates)
    },

    /**
     * 删除月计划
     * @description 根据ID删除指定的月计划记录
     * @param {string} id - 月计划ID（primary key）
     * @returns {Promise<Object>} 包含删除结果的对象
     * @throws {Error} 数据删除失败时抛出异常
     * @example
     * await monthlyPlans.delete('monthly_plan_456')
     */
    async delete(id) {
        return await supabase.delete(id)
    }
}
