/**
 * goalCategories.js
 * 目标分类（Category）的 CRUD 操作模块
 * 提供 plans_category 表的查询、创建、更新、删除接口
 */

import client from '@/config/supabase'
import { TABLES } from './tables'

const supabase = client.createBase(TABLES.GOAL_CATEGORIES)

export const goalCategories = {
    async list() {
        return await supabase.query(q => q
            .select('*')
            .order('name', { ascending: true })
        )
    },
    async create(category) {
        return await supabase.create(category)
    },
    async update(id, updates) {
        return await supabase.update(id, updates)
    },
    async delete(id) {
        return await supabase.delete(id)
    }
}
