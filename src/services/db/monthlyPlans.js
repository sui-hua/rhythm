/**
 * ============================================
 * 月计划数据表操作 (services/db/monthlyPlans.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 monthly_plans 表的 CRUD 操作
 * - 月计划属于目标的下级，计划的上级（三级级联第二级）
 *
 * 【方法说明】
 * - list(planId)    → 按目标查询月计划列表
 * - create()        → 创建月计划
 * - update()        → 更新月计划信息
 * - delete()        → 删除月计划
 */
import client from '@/config/supabase'

const supabase = client.createBase('monthly_plans')

export const monthlyPlans = {
    async list(planId) {
        return await supabase.query(q => {
            let query = q.select('*').order('month', { ascending: true })
            if (planId) query = query.eq('plan_id', planId)
            return query
        })
    },
    async create(plan) {
        return await supabase.create(plan)
    },
    async update(id, updates) {
        return await supabase.update(id, updates)
    },
    async delete(id) {
        return await supabase.delete(id)
    }
}
