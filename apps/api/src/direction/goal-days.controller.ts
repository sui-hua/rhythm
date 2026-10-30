import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUserId } from '../common/current-user-id.decorator.js';
import {
  CreateGoalDayDto,
  DateQueryDto,
  DeleteGoalDaysDto,
  MonthIdQueryDto,
  MonthRangeQueryDto,
  UpdateGoalDayDto,
} from './dto/direction.dto.js';
import { GoalDaysService } from './goal-days.service.js';

@Controller('goal-days')
export class GoalDaysController {
  constructor(private readonly goalDaysService: GoalDaysService) {}

  @Get()
  list(@CurrentUserId() userId: string, @Query() query: MonthIdQueryDto) {
    return this.goalDaysService.list(userId, query.goal_month_id);
  }

  /** 静态路径必须排在 :id 之前 */
  @Get('by-month')
  byMonth(@CurrentUserId() userId: string, @Query() query: MonthRangeQueryDto) {
    return this.goalDaysService.listByMonth(userId, query.start, query.end);
  }

  @Get('by-date')
  byDate(@CurrentUserId() userId: string, @Query() query: DateQueryDto) {
    return this.goalDaysService.listByDate(userId, query.date);
  }

  /** 时间线视图：当天 + 结转未完成项 */
  @Get('day-view')
  dayView(@CurrentUserId() userId: string, @Query() query: DateQueryDto) {
    return this.goalDaysService.listForDayView(userId, query.date);
  }

  @Get(':id')
  detail(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.goalDaysService.getById(userId, id);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateGoalDayDto) {
    return this.goalDaysService.create(userId, dto);
  }

  @Post('batch-delete')
  removeByIds(@CurrentUserId() userId: string, @Body() dto: DeleteGoalDaysDto) {
    return this.goalDaysService.removeByIds(userId, dto.ids);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDayDto,
  ) {
    return this.goalDaysService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.goalDaysService.remove(userId, id);
  }
}
