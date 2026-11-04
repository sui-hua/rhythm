import {
  compact,
  defineSerializer,
  relation,
  toDateColumn,
  toTimeColumn,
} from '../../common/index.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { CreateGoalDto, UpdateGoalDto } from '../dto/direction.dto.js';
import { goalDaySerializer } from './goal-day.mapper.js';
import { goalMonthSerializer } from './goal-month.mapper.js';

/** year 是 date 列（只用到年份）、task_time 是 time 列 */
export const goalSerializer = defineSerializer({
  date: ['year'],
  time: ['task_time'],
});

/** 分类关联的输出形状，列表与详情共用 */
export const GOAL_CATEGORY_REF = { select: { id: true, name: true } } as const;

/** 方向页一次取全三层，select 与 shaping 共用同一份定义，避免两边漂移 */
export const GOAL_OVERVIEW_INCLUDE = {
  goal_categories: GOAL_CATEGORY_REF,
  goal_months: {
    orderBy: [{ month: 'asc' }, { created_at: 'asc' }],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      month: true,
      task_time: true,
      duration: true,
      goal_days: {
        orderBy: [{ day: 'asc' }, { created_at: 'asc' }],
        select: {
          id: true,
          title: true,
          description: true,
          day: true,
          status: true,
          task_time: true,
          duration: true,
        },
      },
    },
  },
} satisfies Prisma.goalInclude;

type GoalWithOverview = Prisma.goalGetPayload<{
  include: typeof GOAL_OVERVIEW_INCLUDE;
}>;

/**
 * 方向页的 goal 层输出字段。
 *
 * 与「整行直出」不同，这里只给前端用得上的字段：`user_id` / `created_at`
 * 在树形结构里重复出现没有意义，只会让响应体变大。
 */
const goalOverviewSerializer = defineSerializer({
  pick: [
    'id',
    'title',
    'description',
    'status',
    'priority',
    'year',
    'task_time',
    'duration',
    'category_id',
  ],
  date: ['year'],
  time: ['task_time'],
});

export function toCreateData(
  dto: CreateGoalDto,
  userId: string,
): Prisma.goalCreateInput {
  return {
    user_id: userId,
    title: dto.title,
    description: dto.description ?? null,
    status: dto.status ?? 'active',
    priority: dto.priority ?? 2,
    year: toDateColumn(dto.year ?? null),
    task_time: toTimeColumn(dto.task_time ?? null),
    duration: dto.duration ?? 30,
    carry_over_lookback_days: dto.carry_over_lookback_days ?? 0,
    ...(dto.category_id
      ? { goal_categories: { connect: { id: dto.category_id } } }
      : {}),
  };
}

export function toUpdateData(dto: UpdateGoalDto): Prisma.goalUpdateInput {
  return compact({
    title: dto.title,
    description: dto.description,
    status: dto.status,
    priority: dto.priority,
    year: toDateColumn(dto.year),
    task_time: toTimeColumn(dto.task_time),
    duration: dto.duration,
    carry_over_lookback_days: dto.carry_over_lookback_days,
    goal_categories: relation(dto.category_id),
  });
}

/** goal → months → days 三级结构，逐层用各自的 serializer 处理时间列 */
export function shapeGoalOverview(goal: GoalWithOverview) {
  return {
    ...goalOverviewSerializer.one(goal),
    category: goal.goal_categories
      ? { id: goal.goal_categories.id, name: goal.goal_categories.name }
      : null,
    months: goal.goal_months.map((month) => ({
      ...goalMonthSerializer.one(month),
      days: month.goal_days.map((day) => goalDaySerializer.one(day)),
    })),
  };
}
