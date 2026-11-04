import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/setup-app.js';

/**
 * HTTP 边界契约：这些行为由 `setup-app.ts` 里的三个全局件提供，
 * 与具体业务无关，所以单独一个文件，避免和 data-layer 的业务用例混在一起。
 *
 * 覆盖点：
 * - 非法 UUID 在参数校验阶段就返回 400，不会漏到 SQL 层变成 500
 * - 未声明的请求字段直接 400，拼错字段名不会被静默丢弃
 * - 记录不存在 / 不属于当前用户，都返回 404 + 中文文案
 */
describe('HTTP 边界契约 e2e', () => {
  let app: INestApplication;
  const ownerId = randomUUID();
  const strangerId = randomUUID();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = setupApp(moduleFixture.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('路径参数不是 UUID 时返回 400', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/tasks/not-a-uuid')
      .set('x-user-id', ownerId)
      .expect(400);

    expect(response.body.message).toContain('uuid');
  });

  it('请求体带未声明字段时返回 400，并指出字段名', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('x-user-id', ownerId)
      .send({ title: '拼错字段', startTime: '2026-10-30T01:00:00.000Z' })
      .expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('startTime')]),
    );
  });

  it('查询参数带未声明字段时返回 400', async () => {
    await request(app.getHttpServer())
      .get('/api/tasks')
      .query({ date: '2026-10-30' })
      .set('x-user-id', ownerId)
      .expect(400);
  });

  it('不存在的记录返回 404，文案带业务名词', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/tasks/${randomUUID()}`)
      .set('x-user-id', ownerId)
      .expect(404);

    expect(response.body.message).toBe('任务不存在');
    expect(response.body.path).toBeDefined();
  });

  it('改 / 删他人记录返回 404，而不是 200 或 500', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('x-user-id', ownerId)
      .send({ title: '归属校验' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/tasks/${created.body.id}`)
      .set('x-user-id', strangerId)
      .send({ title: '越权改写' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/tasks/${created.body.id}`)
      .set('x-user-id', strangerId)
      .expect(404);

    // 原记录仍在，且内容未被改动
    const still = await request(app.getHttpServer())
      .get(`/api/tasks/${created.body.id}`)
      .set('x-user-id', ownerId)
      .expect(200);

    expect(still.body.title).toBe('归属校验');
  });
});
