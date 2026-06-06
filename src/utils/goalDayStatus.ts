// goal_days.status 使用 varchar 存储：'active' | 'completed' | 'archived'

// 判断目标日是否已完成
export function isGoalDayCompleted(status: string): boolean {
  return status === 'completed'
}

// 将布尔值转为数据库存储的状态值
export function toGoalDayStatus(completed: boolean): string {
  return completed ? 'completed' : 'active'
}
