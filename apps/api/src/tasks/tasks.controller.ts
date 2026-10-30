import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUserId } from '../common/current-user-id.decorator.js';
import { CreateTaskDto, ListTaskQueryDto, UpdateTaskDto } from './dto/task.dto.js';
import { TasksService } from './tasks.service.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(@CurrentUserId() userId: string, @Query() query: ListTaskQueryDto) {
    return this.tasksService.list(userId, query);
  }

  /** 必须声明在 :id 之前，否则 inbox 会被当成 id 匹配 */
  @Get('inbox')
  inbox(@CurrentUserId() userId: string) {
    return this.tasksService.listInbox(userId);
  }

  @Get(':id')
  detail(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.tasksService.getById(userId, id);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.tasksService.remove(userId, id);
  }
}
