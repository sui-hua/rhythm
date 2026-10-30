import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { parseTimeOfDay, serializeRow, serializeRows } from '../common/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateGoalMonthDto, UpdateGoalMonthDto } from './dto/direction.dto.js';

function toCreateData(dto: CreateGoalMonthDto, userId: string): Prisma.goal_monthsCreateInput {
  return {
    user_id: userId,
    title: dto.title,
    description: dto.description ?? null,
    status: dto.status ?? 'active',
    priority: dto.priority ?? 2,
    ...(dto.month !== undefined ? { month: dto.month ? new Date(dto.month) : null } : {}),
    task_time: parseTimeOfDay(dto.task_time ?? null),
    duration: dto.duration ?? 30,
    ...(dto.goal_id ? { goal: { connect: { id: dto.goal_id } } } : {}),
  };
}

function toUpdateData(dto: UpdateGoalMonthDto): Prisma.goal_monthsUpdateInput {
  const data: Prisma.goal_monthsUpdateInput = {};

  if (dto.title !== undefined) data.title = dto.title;
  if (dto.description !== undefined) data.description = dto.description;
  if (dto.status !== undefined) data.status = dto.status;
  if (dto.priority !== undefined) data.priority = dto.priority;
  if (dto.month !== undefined) data.month = dto.month ? new Date(dto.month) : null;
  if (dto.task_time !== undefined) data.task_time = parseTimeOfDay(dto.task_time);
  if (dto.duration !== undefined) data.duration = dto.duration;
  if (dto.goal_id !== undefined) {
    data.goal = dto.goal_id ? { connect: { id: dto.goal_id } } : { disconnect: true };
  }

  return data;
}

@Injectable()
export class GoalMonthsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 对齐 web 端 goalMonths.list：按 month 升序，可按 goal_id 过滤 */
  async list(userId: string, goalId?: string) {
    const rows = await this.prisma.goal_months.findMany({
      where: { user_id: userId, ...(goalId ? { goal_id: goalId } : {}) },
      orderBy: { month: 'asc' },
    });

    return serializeRows(rows);
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.goal_months.findFirst({
      where: { id, user_id: userId },
    });

    if (!row) throw new NotFoundException('月度目标不存在');

    return row;
  }

  async create(userId: string, dto: CreateGoalMonthDto) {
    const row = await this.prisma.goal_months.create({ data: toCreateData(dto, userId) });
    return serializeRow(row);
  }

  async update(userId: string, id: string, dto: UpdateGoalMonthDto) {
    await this.getById(userId, id);

    const row = await this.prisma.goal_months.update({
      where: { id },
      data: toUpdateData(dto),
    });

    return serializeRow(row);
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.goal_months.delete({ where: { id } });

    return { success: true };
  }
}
