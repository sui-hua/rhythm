import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import {
  formatDateOnly,
  formatTimeOfDay,
  parseTimeOfDay,
  serializeRow,
  subtractDays,
  toDateOnly,
} from '../common/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateGoalDayDto, UpdateGoalDayDto } from './dto/direction.dto.js';

/** date 列比较：转成 UTC 零点的 Date，避免时区导致差一天 */
function toDateColumn(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function toCreateData(dto: CreateGoalDayDto, userId: string): Prisma.goal_daysCreateInput {
  return {
    user_id: userId,
    title: dto.title,
    description: dto.description ?? null,
    status: dto.status ?? 'active',
    priority: dto.priority ?? 2,
    day: toDateColumn(dto.day),
    task_time: parseTimeOfDay(dto.task_time ?? null),
    duration: dto.duration ?? 30,
    ...(dto.goal_month_id ? { goal_months: { connect: { id: dto.goal_month_id } } } : {}),
  };
}

function toUpdateData(dto: UpdateGoalDayDto): Prisma.goal_daysUpdateInput {
  const data: Prisma.goal_daysUpdateInput = {};

  if (dto.title !== undefined) data.title = dto.title;
  if (dto.description !== undefined) data.description = dto.description;
  if (dto.status !== undefined) data.status = dto.status;
  if (dto.priority !== undefined) data.priority = dto.priority;
  if (dto.day !== undefined) data.day = toDateColumn(dto.day);
  if (dto.task_time !== undefined) data.task_time = parseTimeOfDay(dto.task_time);
  if (dto.duration !== undefined) data.duration = dto.duration;
  if (dto.goal_month_id !== undefined) {
    data.goal_months = dto.goal_month_id
      ? { connect: { id: dto.goal_month_id } }
      : { disconnect: true };
  }

  return data;
}

/** 关联查询用到的 select，保持与 web 端 listByDate 的嵌套结构一致 */
const MONTH_WITH_GOAL_SELECT = {
  id: true,
  task_time: true,
  duration: true,
  goal: { select: { id: true, task_time: true, duration: true, carry_over_lookback_days: true } },
} satisfies Prisma.goal_monthsSelect;

type GoalDayWithMonth = Prisma.goal_daysGetPayload<{
  include: { goal_months: { select: typeof MONTH_WITH_GOAL_SELECT } };
}>;

@Injectable()
export class GoalDaysService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, monthPlanId?: string) {
    const rows = await this.prisma.goal_days.findMany({
      where: { user_id: userId, ...(monthPlanId ? { goal_month_id: monthPlanId } : {}) },
      orderBy: { day: 'asc' },
    });

    return rows.map((row) => serializeRow(row as unknown as Record<string, unknown>));
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.goal_days.findFirst({
      where: { id, user_id: userId },
      include: { goal_months: { select: MONTH_WITH_GOAL_SELECT } },
    });

    if (!row) throw new NotFoundException('日目标不存在');

    return this.shapeDetailed(row);
  }

  async create(userId: string, dto: CreateGoalDayDto) {
    const row = await this.prisma.goal_days.create({ data: toCreateData(dto, userId) });
    return serializeRow(row as unknown as Record<string, unknown>);
  }

  async update(userId: string, id: string, dto: UpdateGoalDayDto) {
    await this.getById(userId, id);

    const row = await this.prisma.goal_days.update({
      where: { id },
      data: toUpdateData(dto),
    });

    return serializeRow(row as unknown as Record<string, unknown>);
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.goal_days.delete({ where: { id } });

    return { success: true };
  }

  /** 批量删除，对齐 web 端 deleteByIds：空数组直接返回 0 */
  async removeByIds(userId: string, ids: string[]) {
    if (ids.length === 0) return { count: 0 };

    const result = await this.prisma.goal_days.deleteMany({
      where: { user_id: userId, id: { in: ids } },
    });

    return { count: result.count };
  }

  /** 月份区间查询（按 day 字段，不区分归属月份） */
  async listByMonth(userId: string, start: string, end: string) {
    const rows = await this.prisma.goal_days.findMany({
      where: {
        user_id: userId,
        day: { gte: toDateColumn(toDateOnly(new Date(start))), lte: toDateColumn(toDateOnly(new Date(end))) },
      },
      orderBy: { day: 'asc' },
    });

    return rows.map((row) => serializeRow(row as unknown as Record<string, unknown>));
  }

  /** 某一天的所有日目标，带月度与年度目标的时间信息 */
  async listByDate(userId: string, date: string) {
    const dayStr = toDateOnly(new Date(date));

    const rows = await this.prisma.goal_days.findMany({
      where: { user_id: userId, day: toDateColumn(dayStr) },
      orderBy: { day: 'asc' },
      include: { goal_months: { select: MONTH_WITH_GOAL_SELECT } },
    });

    return rows.map((row) => this.shapeDetailed(row));
  }

  /**
   * 时间线视图：当天全部 + 结转的未完成项。
   *
   * 结转规则与 web 端 listForDayView 完全一致：
   * 1. 取所有目标里最大的 carry_over_lookback_days 作为查询窗口
   * 2. 当天项无条件保留
   * 3. 历史项必须 status='active'、所属目标配置了回溯天数、且落在窗口内
   */
  async listForDayView(userId: string, date: string) {
    const targetDate = new Date(date);
    const targetStr = toDateOnly(targetDate);
    const maxLookback = await this.getMaxCarryOverLookbackDays(userId);

    if (maxLookback === 0) {
      return this.listByDate(userId, targetStr);
    }

    const earliestStr = toDateOnly(subtractDays(targetDate, maxLookback));

    const rows = await this.prisma.goal_days.findMany({
      where: {
        user_id: userId,
        day: { gte: toDateColumn(earliestStr), lte: toDateColumn(targetStr) },
      },
      orderBy: { day: 'asc' },
      include: { goal_months: { select: MONTH_WITH_GOAL_SELECT } },
    });

    const result: Record<string, unknown>[] = [];

    for (const row of rows) {
      const dayStr = formatDateOnly(row.day) ?? '';
      const monthInfo = row.goal_months
        ? {
            id: row.goal_months.id,
            task_time: formatTimeOfDay(row.goal_months.task_time),
            duration: row.goal_months.duration,
          }
        : null;

      if (dayStr === targetStr) {
        result.push(this.shapeDayView(row, monthInfo));
        continue;
      }

      if (row.status !== 'active') continue;

      const lookback = row.goal_months?.goal?.carry_over_lookback_days ?? 0;
      if (lookback <= 0) continue;

      const earliestAllowed = toDateColumn(toDateOnly(subtractDays(targetDate, lookback)));
      if (row.day >= earliestAllowed && dayStr < targetStr) {
        result.push(this.shapeDayView(row, monthInfo));
      }
    }

    return result;
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

  /** 当天视图：只保留月份层的时间信息，去掉嵌套的 goal */
  private shapeDayView(row: GoalDayWithMonth, monthInfo: Record<string, unknown> | null) {
    const { goal_months: _ignored, ...rest } = row;
    const shaped = serializeRow(rest as unknown as Record<string, unknown>);

    if (monthInfo) shaped.goal_months = monthInfo;

    return shaped;
  }

  /** 详情视图：保留完整嵌套（月份 + 年度目标） */
  private shapeDetailed(row: GoalDayWithMonth) {
    const { goal_months: month, ...rest } = row;
    const shaped = serializeRow(rest as unknown as Record<string, unknown>);

    if (month) {
      shaped.goal_months = {
        id: month.id,
        task_time: formatTimeOfDay(month.task_time),
        duration: month.duration,
        goal: month.goal
          ? {
              id: month.goal.id,
              task_time: formatTimeOfDay(month.goal.task_time),
              duration: month.goal.duration,
              carry_over_lookback_days: month.goal.carry_over_lookback_days,
            }
          : null,
      };
    } else {
      shaped.goal_months = null;
    }

    return shaped;
  }
}
