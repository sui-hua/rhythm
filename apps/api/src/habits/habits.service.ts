import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { getLocalDayRange, parseTimeOfDay, serializeRow, serializeRows } from '../common/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateHabitDto, CreateHabitLogDto, UpdateHabitDto } from './dto/habit.dto.js';

function toCreateData(dto: CreateHabitDto, userId: string): Prisma.habitCreateInput {
  return {
    user_id: userId,
    title: dto.title,
    frequency: (dto.frequency ?? { type: 'daily' }) as Prisma.InputJsonValue,
    task_time: parseTimeOfDay(dto.task_time ?? null),
    duration: dto.duration ?? 10,
    target_value: dto.target_value ?? 1,
    is_archived: dto.is_archived ?? false,
  };
}

function toUpdateData(dto: UpdateHabitDto): Prisma.habitUpdateInput {
  const data: Prisma.habitUpdateInput = {};

  if (dto.title !== undefined) data.title = dto.title;
  if (dto.frequency !== undefined) data.frequency = dto.frequency as Prisma.InputJsonValue;
  if (dto.task_time !== undefined) data.task_time = parseTimeOfDay(dto.task_time);
  if (dto.duration !== undefined) data.duration = dto.duration;
  if (dto.target_value !== undefined) data.target_value = dto.target_value;
  if (dto.is_archived !== undefined) data.is_archived = dto.is_archived;

  return data;
}

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, includeArchived = false) {
    const rows = await this.prisma.habit.findMany({
      where: {
        user_id: userId,
        ...(includeArchived ? {} : { is_archived: false }),
      },
      orderBy: { created_at: 'asc' },
    });

    return serializeRows(rows);
  }

  async create(userId: string, dto: CreateHabitDto) {
    const row = await this.prisma.habit.create({ data: toCreateData(dto, userId) });
    return serializeRow(row);
  }

  async update(userId: string, id: string, dto: UpdateHabitDto) {
    await this.getById(userId, id);

    const row = await this.prisma.habit.update({
      where: { id },
      data: toUpdateData(dto),
    });

    return serializeRow(row);
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.habit.delete({ where: { id } });

    return { success: true };
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.habit.findFirst({
      where: { id, user_id: userId },
    });

    if (!row) throw new NotFoundException('习惯不存在');

    return row;
  }

  /** 按完成时间区间查询打卡记录，用于日历 / 热力图 */
  async listLogsBetween(userId: string, start: string, end: string) {
    const rows = await this.prisma.habit_logs.findMany({
      where: {
        user_id: userId,
        completed_at: { gte: new Date(start), lte: new Date(end) },
      },
      orderBy: { completed_at: 'asc' },
    });

    return serializeRows(rows);
  }

  /** 单个习惯的全部打卡记录，用于连续天数 / 热力图统计 */
  async listLogsByHabit(userId: string, habitId: string) {
    await this.getById(userId, habitId);

    const rows = await this.prisma.habit_logs.findMany({
      where: { habit_id: habitId, user_id: userId },
      orderBy: { completed_at: 'asc' },
    });

    return serializeRows(rows);
  }

  async listLogsByYear(userId: string, year: number) {
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const rows = await this.prisma.habit_logs.findMany({
      where: {
        user_id: userId,
        completed_at: { gte: start, lte: end },
      },
      orderBy: { completed_at: 'asc' },
    });

    return serializeRows(rows);
  }

  /**
   * 打卡。对齐 web 端 habit.log 的幂等语义：
   * 同一习惯同一自然日已有记录时直接复用，不覆盖旧备注。
   */
  async log(userId: string, habitId: string, dto: CreateHabitLogDto) {
    await this.getById(userId, habitId);

    const target = dto.completed_at ? new Date(dto.completed_at) : new Date();
    const { startOfDay, endOfDay } = getLocalDayRange(target);

    const existing = await this.prisma.habit_logs.findFirst({
      where: {
        habit_id: habitId,
        user_id: userId,
        completed_at: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { completed_at: 'asc' },
    });

    if (existing) return serializeRow(existing);

    const row = await this.prisma.habit_logs.create({
      data: {
        habit_id: habitId,
        user_id: userId,
        log: dto.log ?? '',
        ...(dto.completed_at ? { completed_at: new Date(dto.completed_at) } : {}),
      },
    });

    return serializeRow(row);
  }

  async deleteLog(userId: string, logId: string) {
    const existing = await this.prisma.habit_logs.findFirst({
      where: { id: logId, user_id: userId },
    });

    if (!existing) throw new NotFoundException('打卡记录不存在');

    await this.prisma.habit_logs.delete({ where: { id: logId } });

    return { success: true };
  }
}
