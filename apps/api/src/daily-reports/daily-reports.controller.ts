import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/current-user-id.decorator.js';
import { CreateDailyReportDto } from './dto/daily-report.dto.js';
import { DailyReportsService } from './daily-reports.service.js';

@Controller('daily-reports')
export class DailyReportsController {
  constructor(private readonly dailyReportsService: DailyReportsService) {}

  @Get(':date')
  byDate(@CurrentUserId() userId: string, @Param('date') date: string) {
    return this.dailyReportsService.getByUserAndDate(userId, date);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateDailyReportDto) {
    return this.dailyReportsService.create(userId, dto.report_date);
  }
}
