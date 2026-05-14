import client from '@/config/supabase'
import { goal } from './db/goal'
import { goalMonths } from './db/goalMonths'
import { goalDays } from './db/goalDays'
import { habit } from './db/habit'
import { task } from './db/task'
import { summary } from './db/summary'
import { goalCategories } from './db/goalCategories'
import { dailyReportLog } from './db/dailyReportLog'

export const db = {
  rpc(name, params) {
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
