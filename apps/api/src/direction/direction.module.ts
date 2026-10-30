import { Module } from '@nestjs/common';
import { GoalCategoriesController } from './goal-categories.controller.js';
import { GoalCategoriesService } from './goal-categories.service.js';
import { GoalDaysController } from './goal-days.controller.js';
import { GoalDaysService } from './goal-days.service.js';
import { GoalMonthsController } from './goal-months.controller.js';
import { GoalMonthsService } from './goal-months.service.js';
import { GoalsController } from './goals.controller.js';
import { GoalsService } from './goals.service.js';

/** 所向（Direction）模块：goal → goal_months → goal_days 三级 + 分类 */
@Module({
  controllers: [
    GoalsController,
    GoalCategoriesController,
    GoalMonthsController,
    GoalDaysController,
  ],
  providers: [GoalsService, GoalCategoriesService, GoalMonthsService, GoalDaysService],
})
export class DirectionModule {}
