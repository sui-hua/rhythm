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
import { createClient } from '@supabase/supabase-js'

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
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 列表查询选项接口
interface ListOptions {
  orderField?: string
  ascending?: boolean
  selectFields?: string
}

// 动态表名无法直接套用 Supabase 生成类型，这里用最小查询接口隔离 SDK 链式调用。
interface SupabaseQueryResult<TData = unknown> {
  data: TData | null
  error: unknown
}

// create/update payload 只允许对象形状，避免 any 从数据层继续扩散。
type CreatePayload<T extends object> = Partial<T>
type UpdatePayload<T extends object> = Partial<T>

interface SupabaseTableQuery extends PromiseLike<SupabaseQueryResult> {
  select: (columns?: string) => SupabaseTableQuery
  insert: (payload: object | object[]) => SupabaseTableQuery
  update: (payload: object) => SupabaseTableQuery
  delete: () => SupabaseTableQuery
  eq: (column: string, value: string | number | boolean | null) => SupabaseTableQuery
  gt: (column: string, value: string | number | boolean | null) => SupabaseTableQuery
  gte: (column: string, value: string | number | boolean | null) => SupabaseTableQuery
  lte: (column: string, value: string | number | boolean | null) => SupabaseTableQuery
  in: (column: string, values: Array<string | number>) => SupabaseTableQuery
  limit: (count: number) => SupabaseTableQuery
  order: (column: string, options?: { ascending?: boolean }) => SupabaseTableQuery
  single: () => PromiseLike<SupabaseQueryResult>
}

type QueryBuilderFn<TData extends object> = (
  query: SupabaseTableQuery
) => PromiseLike<SupabaseQueryResult<TData[]>> | SupabaseTableQuery

// 基础 CRUD 服务接口
interface BaseService<T extends object = Record<string, unknown>> {
  list: (options?: ListOptions) => Promise<T[]>
  getById: (id: string | number) => Promise<T>
  create: <U extends object = T>(payload: CreatePayload<U>) => Promise<U>
  createMany: <U extends object = T>(payloadArray: CreatePayload<U>[]) => Promise<U[]>
  update: <U extends object = T>(id: string | number, updates: UpdatePayload<U>) => Promise<U>
  query: <U extends object = T>(queryFn: QueryBuilderFn<U>) => Promise<U[]>
  delete: (id: string | number) => Promise<void>
}

// 获取动态表查询对象，统一收敛 Supabase 动态表名带来的 unknown 转换。
function table(tableName: string): SupabaseTableQuery {
  return supabase.from(tableName) as unknown as SupabaseTableQuery
}

/**
 * 创建一个基础的数据库服务对象（CRUD 工厂函数）
 * @param tableName - 目标表名
 * @returns 包含标准 CRUD 操作的对象
 */
function createBase<T extends object = Record<string, unknown>>(tableName: string): BaseService<T> {
  return {
    async list(options: ListOptions = {}) {
      const {
        orderField = 'created_at',
        ascending = false,
        selectFields = '*'
      } = options

      const { data, error } = await table(tableName)
        .select(selectFields)
        .order(orderField, { ascending })

      if (error) throw error
      return data as T[]
    },

    async getById(id: string | number) {
      const { data, error } = await table(tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as T
    },

    async create<U extends object = T>(payload: CreatePayload<U>) {
      const { data, error } = await table(tableName)
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data as U
    },

    async createMany<U extends object = T>(payloadArray: CreatePayload<U>[]) {
      const { data, error } = await table(tableName)
        .insert(payloadArray)
        .select()

      if (error) throw error
      return data as U[]
    },

    async update<U extends object = T>(id: string | number, updates: UpdatePayload<U>) {
      const { data, error } = await table(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as U
    },

    async query<U extends object = T>(queryFn: QueryBuilderFn<U>) {
      if (typeof queryFn !== 'function') {
        throw new Error('queryFn 必须是一个函数')
      }
      const { data, error } = await queryFn(table(tableName))
      if (error) throw error
      return data as U[]
    },

    async delete(id: string | number) {
      const { error } = await table(tableName)
        .delete()
        .eq('id', id)

      if (error) throw error
    }
  }
}

export default supabase
export { createBase }
export type { BaseService, ListOptions }
