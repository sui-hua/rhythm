import { Injectable } from '@nestjs/common';
import { toDateColumn } from '../common/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { dailyReportSerializer } from './daily-report.mapper.js';

@Injectable()
export class DailyReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 查询某天的日报生成记录，没有则返回 null（对齐 web 端 getByUserAndDate） */
  async getByUserAndDate(userId: string, reportDate: string) {
    const row = await this.prisma.daily_report_log.findUnique({
      where: { user_id_report_date: this.uniqueKey(userId, reportDate) },
    });

    return row ? dailyReportSerializer.one(row) : null;
  }

  /**
   * 记录某天已生成日报。
   *
   * 用 upsert 而不是「先查再插」：(user_id, report_date) 上有唯一约束，
   * 并发的两次请求在旧写法下会撞 P2002，upsert 让数据库自己做这件事。
   */
  async create(userId: string, reportDate: string) {
    const row = await this.prisma.daily_report_log.upsert({
      where: { user_id_report_date: this.uniqueKey(userId, reportDate) },
      create: this.uniqueKey(userId, reportDate),
      update: {},
    });

    return dailyReportSerializer.one(row);
  }

  private uniqueKey(userId: string, reportDate: string) {
    return { user_id: userId, report_date: toDateColumn(reportDate) };
  }
}
