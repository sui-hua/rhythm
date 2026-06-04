import client from '@/services/supabase'
import { TABLES } from './tables'

// DailyReportLog 数据接口
export interface DailyReportLog {
  id: string
  user_id: string
  report_date: string
  created_at?: string
}

// DailyReportLog 创建参数
export interface CreateDailyReportLogPayload {
  user_id: string
  report_date: string
}

const supabase = client.createBase<DailyReportLog>(TABLES.DAILY_REPORT_LOG)

export const dailyReportLog = {
  async getByUserAndDate(userId: string, reportDate: string): Promise<DailyReportLog | null> {
    if (!userId || !reportDate) return null
    const rows = await supabase.query(q =>
      q.select('*').eq('user_id', userId).eq('report_date', reportDate).limit(1)
    )
    return rows && rows.length ? (rows[0] ?? null) : null
  },

  async create(payload: CreateDailyReportLogPayload): Promise<DailyReportLog> {
    return await supabase.create<DailyReportLog>(payload) as DailyReportLog
  }
}
