import { INestApplication, ValidationPipe } from '@nestjs/common';

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
 * 统一的应用级配置：main.ts 与 e2e 测试共用，避免两边配置漂移。
 */
export function setupApp<T extends INestApplication>(app: T): T {
  // 统一 API 前缀，便于反向代理区分接口与静态资源
  app.setGlobalPrefix('api');

  // 全局校验管道：DTO 上声明 class-validator 装饰器即可生效，未声明字段自动剔除
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: resolveCorsOrigin(),
    credentials: true,
  });

  return app;
}
