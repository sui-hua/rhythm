import {
  compact,
  defineSerializer,
  formatTimeColumn,
  relation,
  toDateColumn,
  toTimeColumn,
} from '../../common/index.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type {
  CreateGoalMonthDto,
  UpdateGoalMonthDto,
} from '../dto/direction.dto.js';

/** month 是 date 列、task_time 是 time 列 */
export const goalMonthSerializer = defineSerializer({
  date: ['month'],
  time: ['task_time'],
});

export function toCreateData(
  dto: CreateGoalMonthDto,
  userId: string,
): Prisma.goal_monthsCreateInput {
  return {
    user_id: userId,
    title: dto.title,
    description: dto.description ?? null,
    status: dto.status ?? 'active',
    priority: dto.priority ?? 2,
    month: toDateColumn(dto.month ?? null),
    task_time: toTimeColumn(dto.task_time ?? null),
    duration: dto.duration ?? 30,
    ...(dto.goal_id ? { goal: { connect: { id: dto.goal_id } } } : {}),
  };
}

export function toUpdateData(
  dto: UpdateGoalMonthDto,
): Prisma.goal_monthsUpdateInput {
  return compact({
    title: dto.title,
    description: dto.description,
    status: dto.status,
    priority: dto.priority,
    month: toDateColumn(dto.month),
    task_time: toTimeColumn(dto.task_time),
    duration: dto.duration,
    goal: relation(dto.goal_id),
  });
}

/** 方向页时间线只用到月份层的时间信息 */
export function shapeGoalMonthTime(month: {
  id: string;
  task_time: Date | null;
  duration: number | null;
}) {
  return {
    id: month.id,
    task_time: formatTimeColumn(month.task_time),
    duration: month.duration,
  };
}
