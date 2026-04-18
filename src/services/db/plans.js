/**
 * ============================================
 * 目标数据表操作 (services/db/plans.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 plans 表的 CRUD 操作
 * - 长期目标管理（三级级联第一级）
 *
 * 【方法说明】
 * - list()    → 查询所有目标（包含分类信息，按优先级排序）
 * - create()  → 创建新目标
 * - update()  → 更新目标信息
 * - delete()  → 删除目标
 */
import client from '@/config/supabase'

const supabase = client.createBase('plans')

export const plans = {
    async list() {
        return await supabase.query(q => q
            .select('*, plans_category(id, name)')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false })
        )
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
