import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateTaskDto,
  ListTaskQueryDto,
  UpdateTaskDto,
} from './dto/task.dto.js';
import {
  taskSerializer,
  toCreateData,
  toTimeRange,
  toUpdateData,
} from './task.mapper.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 按 start_time 范围查询，行为对齐 web 端 task.list：
   * 只按 start_time 过滤，收集箱（无时间）任务不会出现在结果里。
   */
  async list(userId: string, query: ListTaskQueryDto) {
    const where: Prisma.taskWhereInput = { user_id: userId };
    const range = toTimeRange(query.start, query.end);
    if (range) where.start_time = range;

    const rows = await this.prisma.task.findMany({
      where,
      orderBy: { start_time: 'asc' },
    });

    return taskSerializer.many(rows);
  }

  /** 收集箱：未安排时间且未完成的任务 */
  async listInbox(userId: string) {
    const rows = await this.prisma.task.findMany({
      where: { user_id: userId, start_time: null, completed: false },
      orderBy: { created_at: 'desc' },
    });

    return taskSerializer.many(rows);
  }

  /** 详情。把 user_id 一起放进唯一查询，越权与不存在都会走 P2025 → 404 */
  async getById(userId: string, id: string) {
    const row = await this.prisma.task.findUniqueOrThrow({
      where: { id, user_id: userId },
    });

    return taskSerializer.one(row);
  }

  async create(userId: string, dto: CreateTaskDto) {
    const row = await this.prisma.task.create({
      data: toCreateData(dto, userId),
    });

    return taskSerializer.one(row);
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const row = await this.prisma.task.update({
      where: { id, user_id: userId },
      data: toUpdateData(dto),
    });

    return taskSerializer.one(row);
  }

  async remove(userId: string, id: string) {
    await this.prisma.task.delete({ where: { id, user_id: userId } });

    return { success: true };
  }
}
