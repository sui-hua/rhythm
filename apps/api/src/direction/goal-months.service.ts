import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateGoalMonthDto,
  UpdateGoalMonthDto,
} from './dto/direction.dto.js';
import {
  goalMonthSerializer,
  toCreateData,
  toUpdateData,
} from './mappers/goal-month.mapper.js';

@Injectable()
export class GoalMonthsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 对齐 web 端 goalMonths.list：按 month 升序，可按 goal_id 过滤 */
  async list(userId: string, goalId?: string) {
    const rows = await this.prisma.goal_months.findMany({
      where: { user_id: userId, ...(goalId ? { goal_id: goalId } : {}) },
      orderBy: { month: 'asc' },
    });

    return goalMonthSerializer.many(rows);
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.goal_months.findUniqueOrThrow({
      where: { id, user_id: userId },
    });

    return goalMonthSerializer.one(row);
  }

  async create(userId: string, dto: CreateGoalMonthDto) {
    const row = await this.prisma.goal_months.create({
      data: toCreateData(dto, userId),
    });

    return goalMonthSerializer.one(row);
  }

  async update(userId: string, id: string, dto: UpdateGoalMonthDto) {
    const row = await this.prisma.goal_months.update({
      where: { id, user_id: userId },
      data: toUpdateData(dto),
    });

    return goalMonthSerializer.one(row);
  }

  async remove(userId: string, id: string) {
    await this.prisma.goal_months.delete({ where: { id, user_id: userId } });

    return { success: true };
  }
}
