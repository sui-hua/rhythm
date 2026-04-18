/**
 * ============================================
 * 日计划数据表操作 (services/db/dailyPlans.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 daily_plans 表的 CRUD 操作
 * - 日计划属于月度计划的下级（三级级联第三级）
 *
 * 【方法说明】
 * - list(monthlyPlanId)    → 按月度计划查询日计划列表
 * - create()               → 创建日计划
 * - update()               → 更新日计划信息
 * - delete()               → 删除日计划
 * - listByDate()           → 按日期查询日计划（包含关联的月度计划和上级目标信息）
 */
import client from '@/config/supabase'

const supabase = client.createBase('daily_plans')

export const dailyPlans = {
    async list(monthlyPlanId) {
        return await supabase.query(q => {
            let query = q.select('*').order('day', { ascending: true })
            if (monthlyPlanId) query = query.eq('monthly_plan_id', monthlyPlanId)
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
    },
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
