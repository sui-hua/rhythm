import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { parseTimeOfDay, formatDateOnly, formatTimeOfDay, serializeRow, serializeRows } from '../common/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateGoalDto, UpdateGoalDto } from './dto/direction.dto.js';

function toCreateData(dto: CreateGoalDto, userId: string): Prisma.goalCreateInput {
  return {
    user_id: userId,
    title: dto.title,
    description: dto.description ?? null,
    status: dto.status ?? 'active',
    ...(dto.year !== undefined ? { year: dto.year ? new Date(dto.year) : null } : {}),
    priority: dto.priority ?? 2,
    task_time: parseTimeOfDay(dto.task_time ?? null),
    duration: dto.duration ?? 30,
    carry_over_lookback_days: dto.carry_over_lookback_days ?? 0,
    ...(dto.category_id ? { goal_categories: { connect: { id: dto.category_id } } } : {}),
  };
}

function toUpdateData(dto: UpdateGoalDto): Prisma.goalUpdateInput {
  const data: Prisma.goalUpdateInput = {};

  if (dto.title !== undefined) data.title = dto.title;
  if (dto.description !== undefined) data.description = dto.description;
  if (dto.status !== undefined) data.status = dto.status;
  if (dto.year !== undefined) data.year = dto.year ? new Date(dto.year) : null;
  if (dto.priority !== undefined) data.priority = dto.priority;
  if (dto.task_time !== undefined) data.task_time = parseTimeOfDay(dto.task_time);
  if (dto.duration !== undefined) data.duration = dto.duration;
  if (dto.carry_over_lookback_days !== undefined) {
    data.carry_over_lookback_days = dto.carry_over_lookback_days;
  }
  if (dto.category_id !== undefined) {
    data.goal_categories = dto.category_id
      ? { connect: { id: dto.category_id } }
      : { disconnect: true };
  }

  return data;
}

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 对齐 web 端 goal.list：带分类关联，priority 倒序 + created_at 倒序 */
  async list(userId: string) {
    const rows = await this.prisma.goal.findMany({
      where: { user_id: userId },
      include: {
        goal_categories: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
    });

    return serializeRows(rows);
  }

  /**
   * 方向页用的三级结构：goal → goal_months → goal_days。
   *
   * 逐层显式映射而不是 serializeRows，因为嵌套对象里的 date / time 列
   * 不会被浅层的 serializeRow 处理，直接返回会变成 ISO 时间戳。
   */
  async overview(userId: string) {
    const rows = await this.prisma.goal.findMany({
      where: { user_id: userId },
      include: {
        goal_categories: { select: { id: true, name: true } },
        goal_months: {
          orderBy: [{ month: 'asc' }, { created_at: 'asc' }],
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            month: true,
            task_time: true,
            duration: true,
            goal_days: {
              orderBy: [{ day: 'asc' }, { created_at: 'asc' }],
              select: {
                id: true,
                title: true,
                description: true,
                day: true,
                status: true,
                task_time: true,
                duration: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      year: formatDateOnly(row.year),
      task_time: formatTimeOfDay(row.task_time),
      duration: row.duration,
      category_id: row.category_id,
      category: row.goal_categories
        ? { id: row.goal_categories.id, name: row.goal_categories.name }
        : null,
      months: row.goal_months.map((month) => ({
        id: month.id,
        title: month.title,
        description: month.description,
        status: month.status,
        month: formatDateOnly(month.month),
        task_time: formatTimeOfDay(month.task_time),
        duration: month.duration,
        days: month.goal_days.map((day) => ({
          id: day.id,
          title: day.title,
          description: day.description,
          day: formatDateOnly(day.day),
          status: day.status,
          task_time: formatTimeOfDay(day.task_time),
          duration: day.duration,
        })),
      })),
    }));
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.goal.findFirst({
      where: { id, user_id: userId },
      include: {
        goal_categories: { select: { id: true, name: true } },
      },
    });

    if (!row) throw new NotFoundException('目标不存在');

    return row;
  }

  async create(userId: string, dto: CreateGoalDto) {
    const row = await this.prisma.goal.create({
      data: toCreateData(dto, userId),
      include: { goal_categories: { select: { id: true, name: true } } },
    });

    return serializeRow(row);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.getById(userId, id);

    const row = await this.prisma.goal.update({
      where: { id },
      data: toUpdateData(dto),
      include: { goal_categories: { select: { id: true, name: true } } },
    });

    return serializeRow(row);
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.goal.delete({ where: { id } });

    return { success: true };
  }
}
