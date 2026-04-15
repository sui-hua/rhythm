/**
 * Supabase 客户端配置 - 初始化数据库连接并扩展 CRUD 基础方法
 * 从环境变量读取 VITE_SUPABASE_URL 和 VITE_SUPABASE_KEY
 */
import { createClient } from '@supabase/supabase-js'
import { trackGlobalLoading } from '@/composables/useGlobalLoading'

// 从环境变量获取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

// 验证必需的环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase 环境变量缺失:', {
    url: supabaseUrl,
    key: supabaseAnonKey
  })
}

// 创建 Supabase 客户端实例
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 扩展 createBase(tableName) 方法：生成标准 CRUD 对象（list/getById/create/update/delete/query）
supabase.createBase = (tableName) => {
  return {
    async list(options = {}) {
      return await trackGlobalLoading(async () => {
        const {
          orderField = 'created_at',
          ascending = false,
          selectFields = '*'
        } = options

        const { data, error } = await supabase
          .from(tableName)
          .select(selectFields)
          .order(orderField, { ascending })

        if (error) throw error
        return data
      })
    },

    async getById(id) {
      return await trackGlobalLoading(async () => {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      })
    },

    async create(payload) {
      return await trackGlobalLoading(async () => {
        const { data, error } = await supabase
          .from(tableName)
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        return data
      })
    },

    async createMany(payloadArray) {
      return await trackGlobalLoading(async () => {
        const { data, error } = await supabase
          .from(tableName)
          .insert(payloadArray)
          .select()

        if (error) throw error
        return data
      })
    },

    async update(id, updates) {
      return await trackGlobalLoading(async () => {
        const { data, error } = await supabase
          .from(tableName)
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      })
    },

    /**
     * 执行自定义复杂查询
     * @param {Function} queryFn - 接收 query builder 的回调函数，返回构建好的查询对象
     */
    async query(queryFn) {
      return await trackGlobalLoading(async () => {
        if (typeof queryFn !== 'function') {
          throw new Error('queryFn 必须是一个函数')
        }
        const { data, error } = await queryFn(supabase.from(tableName))
        if (error) throw error
        return data
      })
    },

    async delete(id) {
      return await trackGlobalLoading(async () => {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id)

        if (error) throw error
      })
    }
  }
}

export default supabase
