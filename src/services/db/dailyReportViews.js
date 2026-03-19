import client from '@/config/supabase'

const supabase = client.createBase('daily_report_views')

export const dailyReportViews = {
  async getByUserAndDate(userId, reportDate) {
    if (!userId || !reportDate) return null
    const rows = await supabase.query(q =>
      q.select('*').eq('user_id', userId).eq('report_date', reportDate).limit(1)
    )
    return rows && rows.length ? rows[0] : null
  },
  async create(payload) {
    return await supabase.create(payload)
  }
}
