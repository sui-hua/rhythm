import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

const GOAL_STATUS = ['active', 'completed', 'archived'] as const;

/* ------------------------------- goal ------------------------------- */

export class CreateGoalDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(GOAL_STATUS)
  status?: (typeof GOAL_STATUS)[number];

  /** 库里是 date 列，传 YYYY-MM-DD */
  @IsOptional()
  @IsDateString()
  year?: string | null;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsUUID()
  category_id?: string | null;

  @IsOptional()
  @IsString()
  task_time?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  carry_over_lookback_days?: number;
}

export class UpdateGoalDto extends PartialType(CreateGoalDto) {}

/* ---------------------------- goal_month ---------------------------- */

export class CreateGoalMonthDto {
  @IsOptional()
  @IsUUID()
  goal_id?: string | null;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(GOAL_STATUS)
  status?: (typeof GOAL_STATUS)[number];

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsDateString()
  month?: string | null;

  @IsOptional()
  @IsString()
  task_time?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}

export class UpdateGoalMonthDto extends PartialType(CreateGoalMonthDto) {}

/* ----------------------------- goal_day ----------------------------- */

export class CreateGoalDayDto {
  @IsOptional()
  @IsUUID()
  goal_month_id?: string | null;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(GOAL_STATUS)
  status?: (typeof GOAL_STATUS)[number];

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsDateString()
  day!: string;

  @IsOptional()
  @IsString()
  task_time?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;
}

export class UpdateGoalDayDto extends PartialType(CreateGoalDayDto) {}

export class DeleteGoalDaysDto {
  @IsArray()
  @IsUUID('all', { each: true })
  ids!: string[];
}

/* -------------------------- goal_category --------------------------- */

export class CreateGoalCategoryDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}

export class UpdateGoalCategoryDto extends PartialType(CreateGoalCategoryDto) {}

/* ------------------------------ 查询参数 ------------------------------ */

export class MonthRangeQueryDto {
  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;
}

export class GoalIdQueryDto {
  @IsOptional()
  @IsUUID()
  goal_id?: string;
}

export class MonthIdQueryDto {
  @IsOptional()
  @IsUUID()
  goal_month_id?: string;
}

export class DateQueryDto {
  @IsDateString()
  date!: string;
}
