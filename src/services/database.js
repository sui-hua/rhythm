import { plans } from './db/plans'
import { monthlyPlans } from './db/monthlyPlans'
import { dailyPlans } from './db/dailyPlans'
import { habits } from './db/habits'
import { tasks } from './db/tasks'
import { summaries } from './db/summaries'
import { plansCategory } from './db/plansCategory'
import { dailyReportViews } from './db/dailyReportViews'

export const db = {
  // Plans (总计划/年度计划表操作)
  plans,
  // Plan Categories
  plansCategory,
  // Monthly Plans (月计划表操作)
  monthlyPlans,
  // Daily Plans (日计划表操作)
  dailyPlans,
  // Habits (习惯及打卡记录表操作)
  habits,
  // Tasks (每日具体任务表操作)
  tasks,
  // Summaries (各种类型总结记录表操作)
  summaries,
  // Daily report view logs (日报弹窗查看记录)
  dailyReportViews
}
