import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { formatLocalDateOnly, serializeRow } from '../common/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSummaryDto, UpdateSummaryDto } from './dto/summary.dto.js';

/** 把可能为字符串的 content 统一成对象，对齐 web 端 normalizeContent */
function normalizeContent(value: unknown): Record<string, unknown> {
  if (!value) return {};

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  }

  return typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** 把日期字符串按本地零点解析，贴近 Supabase 里 timestamptz 与 date 字符串比较的行为 */
function toLocalStart(value: string): Date {
  return value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
}

@Injectable()
export class SummariesService {
  constructor(private readonly prisma: PrismaService) {}

  /** 对齐 web 端 summary.listByKind：period_start 倒序 */
  async listByKind(userId: string, kind: string) {
    const rows = await this.prisma.summary.findMany({
      where: { user_id: userId, kind },
      orderBy: { period_start: 'desc' },
    });

    return this.toRecords(rows);
  }

  /** 命中区间内的唯一一条记录：period_start <= date <= period_end */
  async getByDateKind(userId: string, date: string, kind: string) {
    const rows = await this.prisma.summary.findMany({
      where: {
        user_id: userId,
        kind,
        period_start: { lte: toLocalStart(date) },
        period_end: { gte: toLocalStart(date) },
      },
      take: 1,
    });

    if (rows.length === 0) return null;

    return this.toRecords(rows)[0] ?? null;
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.summary.findFirst({ where: { id, user_id: userId } });

    if (!row) throw new NotFoundException('总结不存在');

    return this.toRecords([row])[0];
  }

  async create(userId: string, dto: CreateSummaryDto) {
    const row = await this.prisma.summary.create({
      data: {
        user_id: userId,
        kind: dto.kind,
        period_start: toLocalStart(dto.period_start),
        period_end: dto.period_end ? toLocalStart(dto.period_end) : toLocalStart(dto.period_start),
        title: dto.title ?? null,
        content: (dto.content ?? {}) as Prisma.InputJsonValue,
      },
    });

    return this.toRecords([row])[0];
  }

  async update(userId: string, id: string, dto: UpdateSummaryDto) {
    await this.getById(userId, id);

    const data: Prisma.summaryUpdateInput = {};
    if (dto.kind !== undefined) data.kind = dto.kind;
    if (dto.period_start !== undefined) data.period_start = toLocalStart(dto.period_start);
    if (dto.period_end !== undefined) {
      data.period_end = dto.period_end ? toLocalStart(dto.period_end) : null;
    }
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content as Prisma.InputJsonValue;

    const row = await this.prisma.summary.update({ where: { id }, data });

    return this.toRecords([row])[0];
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.summary.delete({ where: { id } });

    return { success: true };
  }

  /**
   * 对齐 mapSummaryRowToRecord：content 归一化、updated_at 缺失时回落到 created_at。
   *
   * period_start / period_end 在库里是 timestamptz，且按本地零点写入，
   * 这里统一裁成本地日期字符串，避免前端拿到 ISO 后切片差一天。
   */
  private toRecords(rows: Record<string, unknown>[]) {
    return rows.map((row) => {
      const serialized = serializeRow(row);

      return {
        ...serialized,
        period_start:
          formatLocalDateOnly(row.period_start as Date | null) ?? serialized.period_start,
        period_end: formatLocalDateOnly(row.period_end as Date | null) ?? serialized.period_end,
        content: normalizeContent(serialized.content),
        updated_at: serialized.updated_at ?? serialized.created_at,
      };
    });
  }
}
