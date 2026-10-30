import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export const SUMMARY_KINDS = ['daily', 'weekly', 'monthly', 'yearly'] as const;

export class CreateSummaryDto {
  @IsIn(SUMMARY_KINDS)
  kind!: (typeof SUMMARY_KINDS)[number];

  @IsDateString()
  period_start!: string;

  @IsOptional()
  @IsDateString()
  period_end?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | null;

  /** 前端按自由键值对存储，daily 为 done/improve/tomorrow，其它类型为 text */
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}

export class UpdateSummaryDto extends PartialType(CreateSummaryDto) {}

export class ListSummaryQueryDto {
  @IsIn(SUMMARY_KINDS)
  kind!: (typeof SUMMARY_KINDS)[number];
}

export class SummaryByDateQueryDto {
  @IsDateString()
  date!: string;

  @IsIn(SUMMARY_KINDS)
  kind!: (typeof SUMMARY_KINDS)[number];
}
