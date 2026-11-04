import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, finalize } from 'rxjs';

/**
 * 一行一条的访问日志：方法、路径、状态码、耗时、调用者。
 *
 * 用 `finalize` 而不是 `tap`，这样成功和失败都会记一条；
 * 失败的堆栈由 `ApiExceptionFilter` 负责，这里只管给人看的摘要。
 * 测试环境静默，避免 e2e 输出被 20 多条日志淹没。
 */
@Injectable()
export class RequestLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (process.env.NODE_ENV === 'test') return next.handle();

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const startedAt = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const response = http.getResponse<Response>();
        const elapsed = Date.now() - startedAt;
        const caller = this.describeCaller(request);

        this.logger.log(
          `${request.method} ${request.originalUrl} ${response.statusCode} ${elapsed}ms${caller}`,
        );
      }),
    );
  }

  /** 只取用户 ID 前 8 位，日志里够定位、又不至于刷满一行 */
  private describeCaller(request: Request): string {
    const raw = request.headers['x-user-id'];
    const userId = Array.isArray(raw) ? raw[0] : raw;

    return userId ? ` user=${userId.slice(0, 8)}` : '';
  }
}
