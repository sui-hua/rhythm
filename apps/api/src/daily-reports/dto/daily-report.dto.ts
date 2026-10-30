import { IsDateString } from 'class-validator';

export class CreateDailyReportDto {
  /** 报表日期，YYYY-MM-DD */
  @IsDateString()
  report_date!: string;
}
