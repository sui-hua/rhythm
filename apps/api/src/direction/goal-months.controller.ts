import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUserId, UuidParam } from '../common/index.js';
import {
  CreateGoalMonthDto,
  GoalIdQueryDto,
  UpdateGoalMonthDto,
} from './dto/direction.dto.js';
import { GoalMonthsService } from './goal-months.service.js';

@Controller('goal-months')
export class GoalMonthsController {
  constructor(private readonly goalMonthsService: GoalMonthsService) {}

  @Get()
  list(@CurrentUserId() userId: string, @Query() query: GoalIdQueryDto) {
    return this.goalMonthsService.list(userId, query.goal_id);
  }

  @Get(':id')
  detail(@CurrentUserId() userId: string, @UuidParam() id: string) {
    return this.goalMonthsService.getById(userId, id);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateGoalMonthDto) {
    return this.goalMonthsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @UuidParam() id: string,
    @Body() dto: UpdateGoalMonthDto,
  ) {
    return this.goalMonthsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @UuidParam() id: string) {
    return this.goalMonthsService.remove(userId, id);
  }
}
