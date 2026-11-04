import { Injectable } from '@nestjs/common';
import { subtractDays, toDateColumn, toDateOnly } from '../common/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateGoalDayDto,
  UpdateGoalDayDto,
} from './dto/direction.dto.js';
import { carriesOver } from './goal-day.carry-over.js';
import {
  MONTH_OF_DAY_SELECT,
  goalDayKey,
  goalDaySerializer,
  shapeGoalDayDetail,
  shapeGoalDayTimeline,
  toCreateData,
  toUpdateData,
} from './mappers/goal-day.mapper.js';

@Injectable()
export class GoalDaysService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, monthPlanId?: string) {
    const rows = await this.prisma.goal_days.findMany({
      where: {
        user_id: userId,
        ...(monthPlanId ? { goal_month_id: monthPlanId } : {}),
      },
      orderBy: { day: 'asc' },
    });

    return goalDaySerializer.many(rows);
  }

  /** 详情带「月 → 年」两级，时间线只用月份层 */
  async getById(userId: string, id: string) {
    const row = await this.prisma.goal_days.findUniqueOrThrow({
      where: { id, user_id: userId },
      include: { goal_months: { select: MONTH_OF_DAY_SELECT } },
    });

    return shapeGoalDayDetail(row);
  }

  async create(userId: string, dto: CreateGoalDayDto) {
    const row = await this.prisma.goal_days.create({
      data: toCreateData(dto, userId),
    });

    return goalDaySerializer.one(row);
  }

  async update(userId: string, id: string, dto: UpdateGoalDayDto) {
    const row = await this.prisma.goal_days.update({
      where: { id, user_id: userId },
      data: toUpdateData(dto),
    });

    return goalDaySerializer.one(row);
  }

  async remove(userId: string, id: string) {
    await this.prisma.goal_days.delete({ where: { id, user_id: userId } });

    return { success: true };
  }

  /** 批量删除，对齐 web 端 deleteByIds：空数组直接返回 0 */
  async removeByIds(userId: string, ids: string[]) {
    if (ids.length === 0) return { count: 0 };

    const { count } = await this.prisma.goal_days.deleteMany({
      where: { user_id: userId, id: { in: ids } },
    });

    return { count };
  }

  /** 月份区间查询（按 day 字段，不区分归属月份） */
  async listByMonth(userId: string, start: string, end: string) {
    const rows = await this.prisma.goal_days.findMany({
      where: {
        user_id: userId,
        day: {
          gte: toDateColumn(toDateOnly(new Date(start))),
          lte: toDateColumn(toDateOnly(new Date(end))),
        },
      },
      orderBy: { day: 'asc' },
    });

    return goalDaySerializer.many(rows);
  }

  /** 某一天的所有日计划，带月度与年度目标的时间信息 */
  async listByDate(userId: string, date: string) {
    const rows = await this.prisma.goal_days.findMany({
      where: { user_id: userId, day: toDateColumn(toDateOnly(new Date(date))) },
      orderBy: { day: 'asc' },
      include: { goal_months: { select: MONTH_OF_DAY_SELECT } },
    });

    return rows.map(shapeGoalDayDetail);
  }

  /**
   * 时间线视图：当天全部 + 结转的未完成项。
   *
   * 先用「所有目标里最大的回溯天数」把查询窗口收窄到一次索引扫描，
   * 再用 `carriesOver` 按每条记录所属目标的回溯天数逐条判定。
   */
  async listForDayView(userId: string, date: string) {
    const targetDate = new Date(date);
    const targetDay = toDateOnly(targetDate);
    const maxLookback = await this.getMaxCarryOverLookbackDays(userId);

    if (maxLookback === 0) return this.listByDate(userId, targetDay);

    const rows = await this.prisma.goal_days.findMany({
      where: {
        user_id: userId,
        day: {
          gte: toDateColumn(subtractDays(targetDate, maxLookback)),
          lte: toDateColumn(targetDay),
        },
      },
      orderBy: { day: 'asc' },
      include: { goal_months: { select: MONTH_OF_DAY_SELECT } },
    });

    return rows
      .filter((row) => {
        const day = goalDayKey(row);
        if (day === targetDay) return true;

        const lookback = row.goal_months?.goal?.carry_over_lookback_days ?? 0;
        return carriesOver(day, row.status ?? '', lookback, targetDay);
      })
      .map(shapeGoalDayTimeline);
  }

  /** 取该用户所有目标中最大的回溯天数，用于收窄查询范围 */
  private async getMaxCarryOverLookbackDays(userId: string): Promise<number> {
    const row = await this.prisma.goal.findFirst({
      where: { user_id: userId, carry_over_lookback_days: { gt: 0 } },
      orderBy: { carry_over_lookback_days: 'desc' },
      select: { carry_over_lookback_days: true },
    });

    return row?.carry_over_lookback_days ?? 0;
  }
}
