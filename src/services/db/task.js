/**
 * ============================================
 * 任务数据表操作 (services/db/tasks.js)
 * ============================================
 *
 * 【模块职责】
 * - 封装 tasks 表的 CRUD 操作
 * - 每日具体任务管理
 *
 * 【方法说明】
 * - list(start, end) → 按时间范围查询任务
 * - create()         → 创建新任务
 * - update()         → 更新任务信息
 * - delete()         → 删除任务
 *
 * 【数据表结构】
 * - id: 主键
 * - title: 任务标题
 * - status: 状态（inbox/pending/completed 等）
 * - start_time: 开始时间
 * - end_time: 结束时间
 * - created_at: 创建时间
 * - updated_at: 更新时间
 */

/**
 * Tasks 模块导出
 * @namespace tasks
 */
import client from '@/config/supabase'
import { TABLES } from './tables'

const supabase = client.createBase(TABLES.TASK)

export const task = {
    /**
     * 按时间范围查询任务列表
     * @async
     * @memberof tasks
     * @param {Date} [start] - 开始时间，会转换为 ISO 字符串用于查询下限
     * @param {Date} [end] - 结束时间，会转换为 ISO 字符串用于查询上限
     * @returns {Promise<import('@/config/supabase').QueryResult>} 查询结果，按 start_time 升序排列
     *
     * @example
     * // 查询 2024-01-01 至 2024-01-31 的任务
     * await tasks.list(new Date('2024-01-01'), new Date('2024-01-31'))
     *
     * @example
     * // 查询所有任务（不限制时间范围）
     * await tasks.list()
     */
    async list(start, end) {
        return await supabase.query(q => {
            let query = q.select('*').order('start_time', { ascending: true })
            if (start) query = query.gte('start_time', start.toISOString())
            if (end) query = query.lte('start_time', end.toISOString())
            return query
        })
    },

    /**
     * 创建新任务
     * @async
     * @memberof tasks
     * @param {Object} task - 任务数据对象
     * @param {string} task.title - 任务标题
     * @param {string} [task.status] - 任务状态，默认 'pending'
     * @param {Date} [task.start_time] - 开始时间
     * @param {Date} [task.end_time] - 结束时间
     * @returns {Promise<import('@/config/supabase').MutationResult>} 创建结果，包含插入的数据
     */
    async create(task) {
        return await supabase.create(task)
    },

    /**
     * 更新指定任务
     * @async
     * @memberof tasks
     * @param {number|string} id - 任务 ID
     * @param {Object} updates - 要更新的字段
     * @param {string} [updates.title] - 任务标题
     * @param {string} [updates.status] - 任务状态
     * @param {Date} [updates.start_time] - 开始时间
     * @param {Date} [updates.end_time] - 结束时间
     * @returns {Promise<import('@/config/supabase').MutationResult>} 更新结果
     */
    async update(id, updates) {
        return await supabase.update(id, updates)
    },

    /**
     * 删除指定任务
     * @async
     * @memberof tasks
     * @param {number|string} id - 任务 ID
     * @returns {Promise<import('@/config/supabase').MutationResult>} 删除结果
     */
    async delete(id) {
        return await supabase.delete(id)
    },

    /**
     * 查询收件箱（Inbox）中的任务
     * @async
     * @memberof tasks
     * @description Inbox 是临时存放新任务的区域，status 字段值为 'inbox'，按创建时间倒序排列
     * @returns {Promise<import('@/config/supabase').QueryResult>} 查询结果，包含所有 inbox 状态的任务
     */
    async listInbox() {
        return await supabase.query(q =>
            q.select('*').eq('status', 'inbox').order('created_at', { ascending: false })
        )
    }
}
