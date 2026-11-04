import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateGoalCategoryDto,
  UpdateGoalCategoryDto,
} from './dto/direction.dto.js';
import {
  goalCategorySerializer,
  toCreateData,
  toUpdateData,
} from './mappers/goal-category.mapper.js';

@Injectable()
export class GoalCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** 对齐 web 端 goalCategories.list：按 name 升序（不是 sort_order） */
  async list(userId: string) {
    const rows = await this.prisma.goal_categories.findMany({
      where: { user_id: userId },
      orderBy: { name: 'asc' },
    });

    return goalCategorySerializer.many(rows);
  }

  async create(userId: string, dto: CreateGoalCategoryDto) {
    const row = await this.prisma.goal_categories.create({
      data: toCreateData(dto, userId),
    });

    return goalCategorySerializer.one(row);
  }

  async update(userId: string, id: string, dto: UpdateGoalCategoryDto) {
    const row = await this.prisma.goal_categories.update({
      where: { id, user_id: userId },
      data: toUpdateData(dto),
    });

    return goalCategorySerializer.one(row);
  }

  async remove(userId: string, id: string) {
    await this.prisma.goal_categories.delete({
      where: { id, user_id: userId },
    });

    return { success: true };
  }
}
