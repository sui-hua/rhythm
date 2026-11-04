import { compact, defineSerializer, toTimestamp } from '../common/index.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { CreateTaskDto, UpdateTaskDto } from './dto/task.dto.js';

/**
 * task 的字段适配层。
 *
 * 只做「API 形状 ↔ 数据库形状」的翻译，不查库、不做业务判断。
 * 之所以独立成文件：service 应该只剩查询与规则，改动 schema 时也只需改这里。
 */

/** task 的时间字段都是 timestamptz，没有 date / time 列，默认按 ISO 输出 */
export const taskSerializer = defineSerializer({});

export function toCreateData(
  dto: CreateTaskDto,
  userId: string,
): Prisma.taskUncheckedCreateInput {
  return {
    user_id: userId,
    title: dto.title,
    description: dto.description ?? null,
    start_time: toTimestamp(dto.start_time ?? null),
    end_time: toTimestamp(dto.end_time ?? null),
    completed: dto.completed ?? false,
  };
}

export function toUpdateData(dto: UpdateTaskDto): Prisma.taskUpdateInput {
  return compact({
    title: dto.title,
    description: dto.description,
    completed: dto.completed,
    start_time: toTimestamp(dto.start_time),
    end_time: toTimestamp(dto.end_time),
    actual_start_time: toTimestamp(dto.actual_start_time),
    actual_end_time: toTimestamp(dto.actual_end_time),
  });
}

/** 时间区间条件：只传一端也成立，两端都没传则不限制 */
export function toTimeRange(
  start?: string,
  end?: string,
): Prisma.DateTimeNullableFilter | undefined {
  if (!start && !end) return undefined;

  return {
    ...(start ? { gte: new Date(start) } : {}),
    ...(end ? { lte: new Date(end) } : {}),
  };
}
