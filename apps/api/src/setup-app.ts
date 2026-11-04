import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ApiExceptionFilter, RequestLogInterceptor } from './common/index.js';

/**
 * 解析允许跨域的来源。
 * 配置了 CORS_ORIGINS 则按白名单放行；未配置时放行全部（仅适合本地开发）。
 */
function resolveCorsOrigin(): boolean | string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return true;

  const origins = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
}

/**
 * 应用级装配：main.ts 与 e2e 共用同一份配置，避免两边漂移。
 *
 * 三个全局件各管一件事：
 * - `ValidationPipe`：DTO 校验 + 未声明字段直接 400（拼错字段名不再被静默丢弃）
 * - `ApiExceptionFilter`：把 Prisma 错误码翻成 4xx，并统一错误响应形状
 * - `RequestLogInterceptor`：一行一条访问日志
 */
export function setupApp<T extends INestApplication>(app: T): T {
  // 统一 API 前缀，便于反向代理区分接口与静态资源
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new RequestLogInterceptor());

  app.enableCors({
    origin: resolveCorsOrigin(),
    credentials: true,
  });

  return app;
}
