import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/setup-app.js';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = setupApp(moduleFixture.createNestApplication());
    await app.init();
  });

  // 健康检查用于部署探活，返回结构需保持稳定
  it('/api/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'rhythm-api',
    });
    expect(typeof response.body.uptime).toBe('number');
  });

  afterAll(async () => {
    await app.close();
  });
});
