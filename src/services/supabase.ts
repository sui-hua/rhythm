/**
 * ============================================
 * Supabase 客户端配置 (services/supabase.ts)
 * ============================================
 *
 * 【模块职责】
 * - 创建并导出 Supabase 客户端实例
 * - 提供通用 CRUD 工厂函数 createBase()
 *
 * 【环境变量】
 * - VITE_SUPABASE_URL    → Supabase 项目 URL
 * - VITE_SUPABASE_KEY    → Supabase Anon Key
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { trackGlobalLoading } from '@/composables/useGlobalLoading'

// 从环境变量获取 Supabase 配置
const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_KEY

// 验证必需的环境变量，缺失则抛出错误阻止应用启动
if (!supabaseUrl || !supabaseAnonKey) {
  const maskedKey: string | undefined = supabaseAnonKey
    ? supabaseAnonKey.slice(0, 4) + '***'
    : undefined
  console.error('Supabase 环境变量缺失:', {
    url: supabaseUrl,
    key: maskedKey
  })
  throw new Error('Supabase 环境变量缺失，应用无法启动')
}

// 创建 Supabase 客户端实例
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// 列表查询选项接口
interface ListOptions {
  orderField?: string
  ascending?: boolean
  selectFields?: string
}

// 基础 CRUD 服务接口
interface BaseService<T = any> {
  list: (options?: ListOptions) => Promise<T[]>
  getById: (id: string | number) => Promise<T>
  create: <U = T>(payload: Partial<U>) => Promise<U>
  createMany: <U = T>(payloadArray: Partial<U>[]) => Promise<U[]>
  update: <U = T>(id: string | number, updates: Partial<U>) => Promise<U>
  query: <U = T>(queryFn: (query: any) => any) => Promise<U[]>
  delete: (id: string | number) => Promise<void>
}

/**
 * 创建一个基础的数据库服务对象（CRUD 工厂函数）
 * @param tableName - 目标表名
 * @returns 包含标准 CRUD 操作的对象
 */
function createBase<T = any>(tableName: string): BaseService<T> {
  return {
    async list(options: ListOptions = {}) {
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
        return data as T[]
      })
    },

    async getById(id: string | number) {
      return await trackGlobalLoading(async () => {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data as T
      })
    },

    async create<U = T>(payload: any) {
      return await trackGlobalLoading(async () => {
        const { data, error } = await supabase
          .from(tableName)
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        return data as U
      })
    },

    async createMany<U = T>(payloadArray: any[]) {
      return await trackGlobalLoading(async () => {
        const { data, error } = await supabase
          .from(tableName)
          .insert(payloadArray)
          .select()

        if (error) throw error
        return data as U[]
      })
    },

    async update<U = T>(id: string | number, updates: any) {
      return await trackGlobalLoading(async () => {
        const { data, error } = await supabase
          .from(tableName)
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data as U
      })
    },

    async query<U = T>(queryFn: (query: any) => any) {
      return await trackGlobalLoading(async () => {
        if (typeof queryFn !== 'function') {
          throw new Error('queryFn 必须是一个函数')
        }
        const { data, error } = await queryFn(supabase.from(tableName))
        if (error) throw error
        return data as U[]
      })
    },

    async delete(id: string | number) {
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

// 扩展 SupabaseClient 类型以包含 createBase 方法
interface ExtendedSupabaseClient extends SupabaseClient {
  createBase: typeof createBase
}

const extendedSupabase = supabase as ExtendedSupabaseClient
extendedSupabase.createBase = createBase

export default extendedSupabase
export type { BaseService, ListOptions }
