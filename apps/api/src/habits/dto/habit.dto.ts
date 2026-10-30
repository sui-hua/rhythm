import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateHabitDto {
  @IsString()
  @MaxLength(100)
  title!: string;

  /** 重复规则：{ type: 'daily' } | { type: 'weekly', weekdays: [] } | { type: 'monthly', monthDays: [] } */
  @IsOptional()
  @IsObject()
  frequency?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  task_time?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  target_value?: number;

  @IsOptional()
  @IsBoolean()
  is_archived?: boolean;
}

export class UpdateHabitDto extends PartialType(CreateHabitDto) {}

export class ListHabitQueryDto {
  /** 传 "true" 时包含已归档习惯，默认只返回未归档 */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  include_archived?: boolean;
}

export class ListHabitLogQueryDto {
  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;
}

export class CreateHabitLogDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  log?: string;

  /** 不传则用数据库默认值 now()，且走当天幂等判断 */
  @IsOptional()
  @IsDateString()
  completed_at?: string;
}
