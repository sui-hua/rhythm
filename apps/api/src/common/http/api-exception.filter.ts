import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

/**
 * 全局异常出口。
 *
 * 目标是把「失败」收敛成一种形状，并且让 service 不必为每种失败写 try/catch：
 * - `HttpException`（含 DTO 校验失败）→ 原样透出状态码，`message` 数组合并成一句话
 * - Prisma 的已知错误码 → 翻成 4xx，文案按模型名生成（`任务不存在` / `月度目标不存在`）
 * - 其余异常 → 500，只回一句通用文案，堆栈只进日志
 *
 * 之所以在这里兜 P2025：service 里的改 / 删统一用 `where: { id, user_id }`
 * 做单查询归属校验，命中不到时 Prisma 抛的就是 P2025，交给这里变成 404，
 * 于是每个模块都不需要再写「先查一遍再改」那两行。
 */

/** Prisma 模型名 → 面向用户的中文名，用于拼 404 文案 */
const MODEL_LABEL: Record<string, string> = {
  task: '任务',
  habit: '习惯',
  habit_logs: '打卡记录',
  goal: '目标',
  goal_months: '月度目标',
  goal_days: '日目标',
  goal_categories: '分类',
  summary: '总结',
  daily_report_log: '日报记录',
};

const PRISMA_STATUS: Record<string, number> = {
  P2000: HttpStatus.BAD_REQUEST, // 字段过长
  P2002: HttpStatus.CONFLICT, // 唯一约束冲突
  P2003: HttpStatus.CONFLICT, // 外键约束
  P2011: HttpStatus.BAD_REQUEST, // 非空约束
  P2023: HttpStatus.BAD_REQUEST, // 列数据格式非法
  P2025: HttpStatus.NOT_FOUND, // 目标记录不存在
};

const PRISMA_MESSAGE: Record<string, string> = {
  P2000: '字段内容过长',
  P2002: '记录已存在，请勿重复提交',
  P2003: '关联数据不存在，或仍被其他数据引用',
  P2011: '必填字段不能为空',
  P2023: '参数格式不正确',
};

type Resolved = {
  status: number;
  message: string;
  errors?: string[];
};

function resolveHttp(exception: HttpException): Resolved {
  const status = exception.getStatus();
  const body = exception.getResponse();

  if (typeof body === 'string') return { status, message: body };

  const message = (body as { message?: unknown }).message;

  if (Array.isArray(message)) {
    return {
      status,
      message: message.join('；'),
      errors: message.map((item) => String(item)),
    };
  }

  return {
    status,
    message: typeof message === 'string' ? message : exception.message,
  };
}

function resolvePrisma(
  exception: Prisma.PrismaClientKnownRequestError,
): Resolved {
  const status =
    PRISMA_STATUS[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

  if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
    return { status, message: '服务器内部错误' };
  }

  if (exception.code === 'P2025') {
    const model = String(exception.meta?.modelName ?? '');
    const label = MODEL_LABEL[model];

    return {
      status,
      message: label ? `${label}不存在` : '记录不存在或无权访问',
    };
  }

  return { status, message: PRISMA_MESSAGE[exception.code] ?? '请求无法处理' };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    const resolved = this.resolve(exception);
    const body = {
      statusCode: resolved.status,
      message: resolved.message,
      ...(resolved.errors ? { errors: resolved.errors } : {}),
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    if (resolved.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const detail =
        exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(
        `${request.method} ${request.originalUrl} 未处理异常`,
        detail,
      );
    }

    response.status(resolved.status).json(body);
  }

  private resolve(exception: unknown): Resolved {
    if (exception instanceof HttpException) return resolveHttp(exception);

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return resolvePrisma(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '服务器内部错误',
    };
  }
}
