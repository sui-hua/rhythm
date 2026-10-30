import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUserId } from '../common/current-user-id.decorator.js';
import { CreateGoalCategoryDto, UpdateGoalCategoryDto } from './dto/direction.dto.js';
import { GoalCategoriesService } from './goal-categories.service.js';

@Controller('goal-categories')
export class GoalCategoriesController {
  constructor(private readonly goalCategoriesService: GoalCategoriesService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.goalCategoriesService.list(userId);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateGoalCategoryDto) {
    return this.goalCategoriesService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGoalCategoryDto,
  ) {
    return this.goalCategoriesService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.goalCategoriesService.remove(userId, id);
  }
}
