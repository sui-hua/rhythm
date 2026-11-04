import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { localDayRange, yearRange } from '../common/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateHabitDto,
  CreateHabitLogDto,
  UpdateHabitDto,
} from './dto/habit.dto.js';
import {
  habitLogSerializer,
  habitSerializer,
  toCreateData,
  toUpdateData,
} from './habit.mapper.js';

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

    return habitSerializer.many(rows);
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.habit.findUniqueOrThrow({
      where: { id, user_id: userId },
    });

    return habitSerializer.one(row);
  }

  async create(userId: string, dto: CreateHabitDto) {
    const row = await this.prisma.habit.create({
      data: toCreateData(dto, userId),
    });

    return habitSerializer.one(row);
  }

  async update(userId: string, id: string, dto: UpdateHabitDto) {
    const row = await this.prisma.habit.update({
      where: { id, user_id: userId },
      data: toUpdateData(dto),
    });

    return habitSerializer.one(row);
  }

  async remove(userId: string, id: string) {
    await this.prisma.habit.delete({ where: { id, user_id: userId } });

    return { success: true };
  }

  /** 按完成时间区间查询打卡记录，用于日历 / 热力图 */
  async listLogsBetween(userId: string, start: string, end: string) {
    return this.listLogs(userId, { gte: new Date(start), lte: new Date(end) });
  }

  async listLogsByYear(userId: string, year: number) {
    const { start, end } = yearRange(year);

    return this.listLogs(userId, { gte: start, lte: end });
  }

  /** 单个习惯的全部打卡记录，用于连续天数 / 热力图统计 */
  async listLogsByHabit(userId: string, habitId: string) {
    await this.assertHabit(userId, habitId);

    const rows = await this.prisma.habit_logs.findMany({
      where: { habit_id: habitId, user_id: userId },
      orderBy: { completed_at: 'asc' },
    });

    return habitLogSerializer.many(rows);
  }

  /**
   * 打卡。对齐 web 端 habit.log 的幂等语义：
   * 同一习惯同一自然日已有记录时直接复用，不覆盖旧备注。
   *
   * 自然日按进程时区计算，所以服务与数据库必须同处一个时区（容器已设 Asia/Shanghai）。
   */
  async log(userId: string, habitId: string, dto: CreateHabitLogDto) {
    await this.assertHabit(userId, habitId);

    const completedAt = dto.completed_at
      ? new Date(dto.completed_at)
      : new Date();
    const { start, end } = localDayRange(completedAt);

    const existing = await this.prisma.habit_logs.findFirst({
      where: {
        habit_id: habitId,
        user_id: userId,
        completed_at: { gte: start, lte: end },
      },
      orderBy: { completed_at: 'asc' },
    });

    if (existing) return habitLogSerializer.one(existing);

    const row = await this.prisma.habit_logs.create({
      data: {
        habit_id: habitId,
        user_id: userId,
        log: dto.log ?? '',
        ...(dto.completed_at ? { completed_at: completedAt } : {}),
      },
    });

    return habitLogSerializer.one(row);
  }

  async deleteLog(userId: string, logId: string) {
    await this.prisma.habit_logs.delete({
      where: { id: logId, user_id: userId },
    });

    return { success: true };
  }

  private async listLogs(
    userId: string,
    completedAt: Prisma.DateTimeNullableFilter,
  ) {
    const rows = await this.prisma.habit_logs.findMany({
      where: { user_id: userId, completed_at: completedAt },
      orderBy: { completed_at: 'asc' },
    });

    return habitLogSerializer.many(rows);
  }

  /** 只校验归属，不取整行：打卡与写日志只要确认习惯属于当前用户 */
  private async assertHabit(userId: string, habitId: string): Promise<void> {
    await this.prisma.habit.findUniqueOrThrow({
      where: { id: habitId, user_id: userId },
      select: { id: true },
    });
  }
}
