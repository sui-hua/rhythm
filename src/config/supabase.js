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

/**
 * 创建一个基础的数据库服务对象
 * @param {string} tableName - 目标表名
 * @returns {object} 包含标准 CRUD 操作的对象
 */
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
