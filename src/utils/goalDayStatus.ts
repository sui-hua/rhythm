// goal_days.status 使用 smallint 存储：0 = 未完成, 1 = 已完成

// 判断目标日是否已完成
export function isGoalDayCompleted(status: number): boolean {
  return status === 1
}

// 将布尔值转为数据库存储的状态值
export function toGoalDayStatus(completed: boolean): number {
  return completed ? 1 : 0
}
