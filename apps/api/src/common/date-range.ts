/**
 * 本地自然日的起止时间。
 *
 * 与 web 端 habit.log 的幂等判断保持一致：同一习惯在同一自然日内只保留一条打卡记录。
 * 时区取决于服务进程的 TZ，容器里已设为 Asia/Shanghai。
 */
export function getLocalDayRange(date: Date): { startOfDay: Date; endOfDay: Date } {
  return {
    startOfDay: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
    endOfDay: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999),
  };
}

/** 输出 YYYY-MM-DD，用于 date 类型字段（goal_days.day 等）的查询条件 */
export function toDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 日期加减天数，返回新 Date，不修改入参 */
export function subtractDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}
