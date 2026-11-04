import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateGoalDto, UpdateGoalDto } from './dto/direction.dto.js';
import {
  GOAL_CATEGORY_REF,
  GOAL_OVERVIEW_INCLUDE,
  goalSerializer,
  shapeGoalOverview,
  toCreateData,
  toUpdateData,
} from './mappers/goal.mapper.js';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 对齐 web 端 goal.list：带分类关联，priority 倒序 + created_at 倒序 */
  async list(userId: string) {
    const rows = await this.prisma.goal.findMany({
      where: { user_id: userId },
      include: { goal_categories: GOAL_CATEGORY_REF },
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
    });

    return goalSerializer.many(rows);
  }

  /** 方向页专用：goal → goal_months → goal_days 一次取全，避免逐级请求 */
  async overview(userId: string) {
    const rows = await this.prisma.goal.findMany({
      where: { user_id: userId },
      include: GOAL_OVERVIEW_INCLUDE,
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
    });

    return rows.map(shapeGoalOverview);
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.goal.findUniqueOrThrow({
      where: { id, user_id: userId },
      include: { goal_categories: GOAL_CATEGORY_REF },
    });

    return goalSerializer.one(row);
  }

  async create(userId: string, dto: CreateGoalDto) {
    const row = await this.prisma.goal.create({
      data: toCreateData(dto, userId),
      include: { goal_categories: GOAL_CATEGORY_REF },
    });

    return goalSerializer.one(row);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    const row = await this.prisma.goal.update({
      where: { id, user_id: userId },
      data: toUpdateData(dto),
      include: { goal_categories: GOAL_CATEGORY_REF },
    });

    return goalSerializer.one(row);
  }

  async remove(userId: string, id: string) {
    await this.prisma.goal.delete({ where: { id, user_id: userId } });

    return { success: true };
  }
}
