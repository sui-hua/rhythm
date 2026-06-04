import client from '@/services/supabase'
import { goal } from './db/goal'
import { goalMonths } from './db/goalMonths'
import { goalDays } from './db/goalDays'
import { habit } from './db/habit'
import { task } from './db/task'
import { summary } from './db/summary'
import { goalCategories } from './db/goalCategories'
import { dailyReportLog } from './db/dailyReportLog'

// 数据库统一入口，聚合所有表的 CRUD 操作与 RPC 调用
export const db = {
  // 直接调用 Supabase RPC 函数（如批量操作等场景）
  rpc(name: string, params?: Record<string, any>) {
    return client.rpc(name, params)
  },
  goal,
  goalCategories,
  goalMonths,
  goalDays,
  habit,
  task,
  summary,
  dailyReportLog
}
