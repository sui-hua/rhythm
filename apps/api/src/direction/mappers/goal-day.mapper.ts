import {
  compact,
  defineSerializer,
  formatDateColumn,
  formatTimeColumn,
  relation,
  toDateColumn,
  toTimeColumn,
} from '../../common/index.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type {
  CreateGoalDayDto,
  UpdateGoalDayDto,
} from '../dto/direction.dto.js';
import { shapeGoalMonthTime } from './goal-month.mapper.js';

/** day 是 date 列、task_time 是 time 列 */
export const goalDaySerializer = defineSerializer({
  date: ['day'],
  time: ['task_time'],
});

/** 详情 / 按日查询要带的月份嵌套：只要时间信息，不要整行 */
export const MONTH_OF_DAY_SELECT = {
  id: true,
  task_time: true,
  duration: true,
  goal: {
    select: {
      id: true,
      task_time: true,
      duration: true,
      carry_over_lookback_days: true,
    },
  },
} satisfies Prisma.goal_monthsSelect;

export type GoalDayWithMonth = Prisma.goal_daysGetPayload<{
  include: { goal_months: { select: typeof MONTH_OF_DAY_SELECT } };
}>;

export function toCreateData(
  dto: CreateGoalDayDto,
  userId: string,
): Prisma.goal_daysCreateInput {
  return {
    user_id: userId,
    title: dto.title,
    description: dto.description ?? null,
    status: dto.status ?? 'active',
    priority: dto.priority ?? 2,
    day: toDateColumn(dto.day),
    task_time: toTimeColumn(dto.task_time ?? null),
    duration: dto.duration ?? 30,
    ...(dto.goal_month_id
      ? { goal_months: { connect: { id: dto.goal_month_id } } }
      : {}),
  };
}

export function toUpdateData(
  dto: UpdateGoalDayDto,
): Prisma.goal_daysUpdateInput {
  return compact({
    title: dto.title,
    description: dto.description,
    status: dto.status,
    priority: dto.priority,
    day: dto.day === undefined ? undefined : toDateColumn(dto.day),
    task_time: toTimeColumn(dto.task_time),
    duration: dto.duration,
    goal_months: relation(dto.goal_month_id),
  });
}

/**
 * 详情形状：保留「日 → 月 → 年」的完整嵌套。
 *
 * 嵌套层的 date / time 列不会被浅层序列化处理，所以逐层显式调用 serializer，
 * 而不是整行丢给 `JSON.stringify`。
 */
export function shapeGoalDayDetail(row: GoalDayWithMonth) {
  const { goal_months: month, ...rest } = row;

  return {
    ...goalDaySerializer.one(rest),
    goal_months: month
      ? {
          ...shapeGoalMonthTime(month),
          goal: month.goal
            ? {
                id: month.goal.id,
                task_time: formatTimeColumn(month.goal.task_time),
                duration: month.goal.duration,
                carry_over_lookback_days: month.goal.carry_over_lookback_days,
              }
            : null,
        }
      : null,
  };
}

/** 时间线形状：只带月份层时间，不带年度目标（当天列表不需要） */
export function shapeGoalDayTimeline(row: GoalDayWithMonth) {
  const { goal_months: month, ...rest } = row;
  const shaped = goalDaySerializer.one(rest);

  if (month) shaped.goal_months = shapeGoalMonthTime(month);

  return shaped;
}

/** 时间线判重用的「哪一天」，与查询条件同一套格式化 */
export function goalDayKey(row: { day: Date | null }): string {
  return formatDateColumn(row.day) ?? '';
}
