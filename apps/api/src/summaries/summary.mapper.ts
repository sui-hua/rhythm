import {
  compact,
  defineSerializer,
  toLocalStart,
  toLocalStartOrNull,
} from '../common/index.js';
import type { Prisma } from '../generated/prisma/client.js';
import type { CreateSummaryDto, UpdateSummaryDto } from './dto/summary.dto.js';

/**
 * summary 的字段适配层。
 *
 * `period_start` / `period_end` 是 timestamptz，但语义是「本地日」，
 * 所以用 localDate 规则输出；`content` 是 JSON 列，空值统一归一成 `{}`。
 * `updated_at` 缺失时回落到 `created_at`，保持 web 端 mapSummaryRowToRecord 的行为。
 */
export const summarySerializer = defineSerializer({
  localDate: ['period_start', 'period_end'],
  json: ['content'],
  fallback: { updated_at: 'created_at' },
});

export function toCreateData(
  dto: CreateSummaryDto,
  userId: string,
): Prisma.summaryUncheckedCreateInput {
  return {
    user_id: userId,
    kind: dto.kind,
    period_start: toLocalStart(dto.period_start),
    period_end: toLocalStart(dto.period_end ?? dto.period_start),
    title: dto.title ?? null,
    content: (dto.content ?? {}) as Prisma.InputJsonValue,
  };
}

export function toUpdateData(dto: UpdateSummaryDto): Prisma.summaryUpdateInput {
  return compact({
    kind: dto.kind,
    period_start: toLocalStartOrNull(dto.period_start),
    period_end: toLocalStartOrNull(dto.period_end),
    title: dto.title,
    content: dto.content as Prisma.InputJsonValue | undefined,
  });
}
