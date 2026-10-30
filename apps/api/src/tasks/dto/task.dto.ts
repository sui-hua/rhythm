import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsDateString()
  start_time?: string | null;

  @IsOptional()
  @IsDateString()
  end_time?: string | null;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsDateString()
  actual_start_time?: string | null;

  @IsOptional()
  @IsDateString()
  actual_end_time?: string | null;
}

export class ListTaskQueryDto {
  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;
}
