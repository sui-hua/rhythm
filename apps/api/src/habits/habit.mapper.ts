import { compact, defineSerializer, toTimeColumn } from '../common/index.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto.js';

/** habit 的字段适配层：time 列 `task_time`、JSON 列 `frequency` */
export const habitSerializer = defineSerializer({
  time: ['task_time'],
  json: ['frequency'],
});

/** 打卡记录只有 timestamptz，按天分组由前端完成 */
export const habitLogSerializer = defineSerializer({});

export function toCreateData(
  dto: CreateHabitDto,
  userId: string,
): Prisma.habitCreateInput {
  return {
    user_id: userId,
    title: dto.title,
    frequency: (dto.frequency ?? { type: 'daily' }) as Prisma.InputJsonValue,
    task_time: toTimeColumn(dto.task_time ?? null),
    duration: dto.duration ?? 10,
    target_value: dto.target_value ?? 1,
    is_archived: dto.is_archived ?? false,
  };
}

export function toUpdateData(dto: UpdateHabitDto): Prisma.habitUpdateInput {
  return compact({
    title: dto.title,
    frequency: dto.frequency as Prisma.InputJsonValue | undefined,
    task_time: toTimeColumn(dto.task_time),
    duration: dto.duration,
    target_value: dto.target_value,
    is_archived: dto.is_archived,
  });
}
