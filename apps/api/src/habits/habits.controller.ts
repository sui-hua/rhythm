import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUserId } from '../common/current-user-id.decorator.js';
import {
  CreateHabitDto,
  CreateHabitLogDto,
  ListHabitLogQueryDto,
  ListHabitQueryDto,
  UpdateHabitDto,
} from './dto/habit.dto.js';
import { HabitsService } from './habits.service.js';

@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  list(@CurrentUserId() userId: string, @Query() query: ListHabitQueryDto) {
    return this.habitsService.list(userId, query.include_archived ?? false);
  }

  /** 静态路径要排在 :id 之前 */
  @Get('logs')
  listLogs(@CurrentUserId() userId: string, @Query() query: ListHabitLogQueryDto) {
    return this.habitsService.listLogsBetween(userId, query.start, query.end);
  }

  @Get('logs/year/:year')
  listLogsByYear(
    @CurrentUserId() userId: string,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.habitsService.listLogsByYear(userId, year);
  }

  @Get(':id/logs')
  listLogsByHabit(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.habitsService.listLogsByHabit(userId, id);
  }

  @Get(':id')
  detail(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.habitsService.getById(userId, id);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.habitsService.remove(userId, id);
  }

  @Post(':id/logs')
  log(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: CreateHabitLogDto,
  ) {
    return this.habitsService.log(userId, id, dto);
  }

  @Delete('logs/:logId')
  deleteLog(@CurrentUserId() userId: string, @Param('logId') logId: string) {
    return this.habitsService.deleteLog(userId, logId);
  }
}
