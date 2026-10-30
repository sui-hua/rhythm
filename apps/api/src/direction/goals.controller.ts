import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/current-user-id.decorator.js';
import { CreateGoalDto, UpdateGoalDto } from './dto/direction.dto.js';
import { GoalsService } from './goals.service.js';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.goalsService.list(userId);
  }

  /** 方向页专用：goal → goal_months → goal_days 一次取全，避免逐级请求 */
  @Get('overview')
  overview(@CurrentUserId() userId: string) {
    return this.goalsService.overview(userId);
  }

  @Get(':id')
  detail(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.goalsService.getById(userId, id);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.goalsService.remove(userId, id);
  }
}
