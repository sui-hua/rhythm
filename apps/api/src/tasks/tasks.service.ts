import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTaskDto, ListTaskQueryDto, UpdateTaskDto } from './dto/task.dto.js';

/** 把 DTO 的 ISO 字符串转换为 Prisma 需要的 Date，其余字段原样透传 */
function toCreateData(dto: CreateTaskDto): Omit<Prisma.taskCreateInput, 'user_id'> {
  return {
    title: dto.title,
    description: dto.description ?? null,
    start_time: dto.start_time ? new Date(dto.start_time) : null,
    end_time: dto.end_time ? new Date(dto.end_time) : null,
    completed: dto.completed ?? false,
  };
}

function toUpdateData(dto: UpdateTaskDto): Prisma.taskUpdateInput {
  const data: Prisma.taskUpdateInput = {};

  if (dto.title !== undefined) data.title = dto.title;
  if (dto.description !== undefined) data.description = dto.description;
  if (dto.completed !== undefined) data.completed = dto.completed;
  if (dto.start_time !== undefined) {
    data.start_time = dto.start_time ? new Date(dto.start_time) : null;
  }
  if (dto.end_time !== undefined) {
    data.end_time = dto.end_time ? new Date(dto.end_time) : null;
  }
  if (dto.actual_start_time !== undefined) {
    data.actual_start_time = dto.actual_start_time ? new Date(dto.actual_start_time) : null;
  }
  if (dto.actual_end_time !== undefined) {
    data.actual_end_time = dto.actual_end_time ? new Date(dto.actual_end_time) : null;
  }

  return data;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 按 start_time 范围查询，行为对齐 web 端 task.list：
   * 只按 start_time 过滤，收集箱（无时间）任务不会出现在结果里。
   */
  list(userId: string, query: ListTaskQueryDto) {
    const where: Prisma.taskWhereInput = { user_id: userId };

    if (query.start || query.end) {
      where.start_time = {
        ...(query.start ? { gte: new Date(query.start) } : {}),
        ...(query.end ? { lte: new Date(query.end) } : {}),
      };
    }

    return this.prisma.task.findMany({
      where,
      orderBy: { start_time: 'asc' },
    });
  }

  /** 收集箱：未安排时间且未完成的任务 */
  listInbox(userId: string) {
    return this.prisma.task.findMany({
      where: { user_id: userId, start_time: null, completed: false },
      orderBy: { created_at: 'desc' },
    });
  }

  async getById(userId: string, id: string) {
    const row = await this.prisma.task.findFirst({
      where: { id, user_id: userId },
    });

    if (!row) throw new NotFoundException('任务不存在');

    return row;
  }

  create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: { ...toCreateData(dto), user_id: userId },
    });
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    // 先校验归属，避免越权改写他人数据
    await this.getById(userId, id);

    return this.prisma.task.update({
      where: { id },
      data: toUpdateData(dto),
    });
  }

  async remove(userId: string, id: string) {
    await this.getById(userId, id);
    await this.prisma.task.delete({ where: { id } });

    return { success: true };
  }
}
