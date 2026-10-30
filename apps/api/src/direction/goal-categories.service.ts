import { Injectable, NotFoundException } from '@nestjs/common';
import { serializeRow, serializeRows } from '../common/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateGoalCategoryDto, UpdateGoalCategoryDto } from './dto/direction.dto.js';

@Injectable()
export class GoalCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** 对齐 web 端 goalCategories.list：按 name 升序（不是 sort_order） */
  async list(userId: string) {
    const rows = await this.prisma.goal_categories.findMany({
      where: { user_id: userId },
      orderBy: { name: 'asc' },
    });

    return serializeRows(rows);
  }

  async create(userId: string, dto: CreateGoalCategoryDto) {
    const row = await this.prisma.goal_categories.create({
      data: {
        user_id: userId,
        name: dto.name,
        sort_order: dto.sort_order ?? 0,
      },
    });

    return serializeRow(row);
  }

  async update(userId: string, id: string, dto: UpdateGoalCategoryDto) {
    await this.getById(userId, id);

    const row = await this.prisma.goal_categories.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.sort_order !== undefined ? { sort_order: dto.sort_order } : {}),
      },
    });

    return serializeRow(row);
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.goal_categories.delete({ where: { id } });

    return { success: true };
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.goal_categories.findFirst({
      where: { id, user_id: userId },
    });

    if (!row) throw new NotFoundException('分类不存在');

    return row;
  }
}
