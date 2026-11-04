import { compact, defineSerializer } from '../../common/index.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type {
  CreateGoalCategoryDto,
  UpdateGoalCategoryDto,
} from '../dto/direction.dto.js';

/** 分类只有纯文本字段，没有需要格式化的列 */
export const goalCategorySerializer = defineSerializer({});

export function toCreateData(
  dto: CreateGoalCategoryDto,
  userId: string,
): Prisma.goal_categoriesCreateInput {
  return {
    user_id: userId,
    name: dto.name,
    sort_order: dto.sort_order ?? 0,
  };
}

export function toUpdateData(
  dto: UpdateGoalCategoryDto,
): Prisma.goal_categoriesUpdateInput {
  return compact({
    name: dto.name,
    sort_order: dto.sort_order,
  });
}
