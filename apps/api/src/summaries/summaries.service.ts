import { Injectable } from '@nestjs/common';
import { toLocalStart } from '../common/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSummaryDto, UpdateSummaryDto } from './dto/summary.dto.js';
import {
  summarySerializer,
  toCreateData,
  toUpdateData,
} from './summary.mapper.js';

@Injectable()
export class SummariesService {
  constructor(private readonly prisma: PrismaService) {}

  /** 对齐 web 端 summary.listByKind：period_start 倒序 */
  async listByKind(userId: string, kind: string) {
    const rows = await this.prisma.summary.findMany({
      where: { user_id: userId, kind },
      orderBy: { period_start: 'desc' },
    });

    return summarySerializer.many(rows);
  }

  /** 命中区间内的唯一一条记录：period_start <= date <= period_end，没有则返回 null */
  async getByDateKind(userId: string, date: string, kind: string) {
    const row = await this.prisma.summary.findFirst({
      where: {
        user_id: userId,
        kind,
        period_start: { lte: toLocalStart(date) },
        period_end: { gte: toLocalStart(date) },
      },
    });

    return row ? summarySerializer.one(row) : null;
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.summary.findUniqueOrThrow({
      where: { id, user_id: userId },
    });

    return summarySerializer.one(row);
  }

  async create(userId: string, dto: CreateSummaryDto) {
    const row = await this.prisma.summary.create({
      data: toCreateData(dto, userId),
    });

    return summarySerializer.one(row);
  }

  async update(userId: string, id: string, dto: UpdateSummaryDto) {
    const row = await this.prisma.summary.update({
      where: { id, user_id: userId },
      data: toUpdateData(dto),
    });

    return summarySerializer.one(row);
  }

  async remove(userId: string, id: string) {
    await this.prisma.summary.delete({ where: { id, user_id: userId } });

    return { success: true };
  }
}
