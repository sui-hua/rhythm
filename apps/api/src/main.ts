import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  const port = Number(process.env.PORT ?? 3001);
  // 监听所有网卡，Expo 真机可通过局域网 IP 直接联调
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);

  Logger.log(`Rhythm API 已启动: http://localhost:${port}/api`, 'Bootstrap');
}

await bootstrap();
