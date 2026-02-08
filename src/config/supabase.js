import { createClient } from '@supabase/supabase-js'

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
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

export default supabase