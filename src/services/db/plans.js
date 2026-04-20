/**
 * ============================================
 * 目标数据表操作 (services/db/plans.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 plans 表的 CRUD 操作
 * - 长期目标管理（三级级联第一级）
 *
 * 【数据模型】
 * plans 表为三级目标级联的第一级（plans → monthly_plans → daily_plans）
 * - plans: 长期目标（年度/季度）
 * - monthly_plans: 月度计划
 * - daily_plans: 每日任务
 *
 * 【关联关系】
 * - plans_category(id, name): 目标分类，N:1 关系
 *
 * 【方法说明】
 * - list()    → 查询所有目标（包含分类信息，按优先级排序）
 * - create()  → 创建新目标
 * - update()  → 更新目标信息
 * - delete()  → 删除目标
 */

/**
 * @fileoverview plans 表（长期目标）数据库操作模块
 * @module services/db/plans
 */

import client from '@/config/supabase'

const supabase = client.createBase('plans')

/**
 * @namespace plans
 * @description 长期目标（Plan）数据表操作集合
 */
export const plans = {
    /**
     * @async
     * @function list
     * @description 查询所有目标（包含分类信息，按优先级和创建时间排序）
     * @returns {Promise<SupabaseResponse>} 包含 plans_category 关联数据的查询结果
     *
     * @example
     * const { data, error } = await plans.list()
     * // 返回按 priority 降序、created_at 降序排列的目标列表
     */
    async list() {
        return await supabase.query(q => q
            .select('*, plans_category(id, name)')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
        )
    },

    /**
     * @async
     * @function create
     * @description 创建新目标
     * @param {Object} plan - 目标数据对象
     * @param {string} [plan.title] - 目标标题
     * @param {number} [plan.priority] - 优先级（数值越大优先级越高）
     * @param {string} [plan.category_id] - 关联的分类 ID
     * @param {string} [plan.description] - 目标描述
     * @returns {Promise<SupabaseResponse>} 创建结果
     *
     * @example
     * const { data, error } = await plans.create({
     *   title: '学习 React',
     *   priority: 10,
     *   category_id: 'xxx'
     * })
     */
    async create(plan) {
        return await supabase.create(plan)
    },

    /**
     * @async
     * @function update
     * @description 更新目标信息
     * @param {string} id - 目标 ID
     * @param {Object} updates - 要更新的字段
     * @param {string} [updates.title] - 目标标题
     * @param {number} [updates.priority] - 优先级
     * @param {string} [updates.category_id] - 关联的分类 ID
     * @param {string} [updates.description] - 目标描述
     * @returns {Promise<SupabaseResponse>} 更新结果
     *
     * @example
     * const { data, error } = await plans.update('xxx', { title: '新标题', priority: 20 })
     */
    async update(id, updates) {
        return await supabase.update(id, updates)
    },

    /**
     * @async
     * @function delete
     * @description 删除目标（级联删除关联的 monthly_plans 和 daily_plans）
     * @param {string} id - 目标 ID
     * @returns {Promise<SupabaseResponse>} 删除结果
     *
     * @example
     * const { data, error } = await plans.delete('xxx')
     */
    async delete(id) {
        return await supabase.delete(id)
    }
}
