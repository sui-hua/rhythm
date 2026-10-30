import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUserId } from '../common/current-user-id.decorator.js';
import {
  CreateSummaryDto,
  ListSummaryQueryDto,
  SummaryByDateQueryDto,
  UpdateSummaryDto,
} from './dto/summary.dto.js';
import { SummariesService } from './summaries.service.js';

@Controller('summaries')
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Get()
  list(@CurrentUserId() userId: string, @Query() query: ListSummaryQueryDto) {
    return this.summariesService.listByKind(userId, query.kind);
  }

  /** 静态路径排在 :id 之前 */
  @Get('by-date')
  byDate(@CurrentUserId() userId: string, @Query() query: SummaryByDateQueryDto) {
    return this.summariesService.getByDateKind(userId, query.date, query.kind);
  }

  @Get(':id')
  detail(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.summariesService.getById(userId, id);
  }

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateSummaryDto) {
    return this.summariesService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSummaryDto,
  ) {
    return this.summariesService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.summariesService.remove(userId, id);
  }
}
