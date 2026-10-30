import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { formatDateOnly, serializeRow } from '../common/index.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** date 列比较：转成 UTC 零点 */
function toDateColumn(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

@Injectable()
export class DailyReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 查询某天的日报生成记录，没有则返回 null（对齐 web 端 getByUserAndDate） */
  async getByUserAndDate(userId: string, reportDate: string) {
    const row = await this.prisma.daily_report_log.findFirst({
      where: { user_id: userId, report_date: toDateColumn(reportDate) },
    });

    if (!row) return null;

    const shaped = serializeRow(row as unknown as Record<string, unknown>);
    shaped.report_date = formatDateOnly(row.report_date);

    return shaped;
  }

  /**
   * 记录某天已生成日报。
   * 表上有 (user_id, report_date) 唯一约束，重复创建时返回既有记录而不是报错。
   */
  async create(userId: string, reportDate: string) {
    const unique = { user_id: userId, report_date: toDateColumn(reportDate) };

    const existing = await this.prisma.daily_report_log.findUnique({
      where: { user_id_report_date: unique },
    });

    if (existing) {
      return serializeRow(existing as unknown as Record<string, unknown>);
    }

    const row = await this.prisma.daily_report_log.create({ data: unique });

    return serializeRow(row as unknown as Record<string, unknown>);
  }
}
