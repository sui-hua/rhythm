import { daysBetween } from '../common/index.js';

/**
 * 日计划的「结转」判定。
 *
 * 与 web 端 `listForDayView` 保持同一规则：目标日当天无条件出现；
 * 历史项只有同时满足三条才继续展示——
 * 1. 状态下是未完成（`active`）
 * 2. 所属年度目标配置了回溯天数
 * 3. 距今不超过该目标配置的天数
 *
 * 纯函数，不碰数据库，方便为边界情况单独写用例。
 */
export function carriesOver(
  day: string,
  status: string,
  lookbackDays: number,
  targetDay: string,
): boolean {
  if (status !== 'active') return false;
  if (lookbackDays <= 0) return false;
  if (day >= targetDay) return false;

  return daysBetween(day, targetDay) <= lookbackDays;
}
