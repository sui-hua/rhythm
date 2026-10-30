import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/setup-app.js';

/**
 * 数据层冒烟测试：验证路由、DTO 校验、Prisma 读写链路是否打通。
 * 依赖本地 Postgres（docker compose up -d），每个用例用独立的 user_id 隔离数据。
 */
describe('数据层 e2e', () => {
  let app: INestApplication;
  const userId = randomUUID();

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

  describe('鉴权前置', () => {
    it('缺少 x-user-id 时返回 401', async () => {
      await request(app.getHttpServer()).get('/api/tasks').expect(401);
    });
  });

  describe('tasks', () => {
    let taskId: string;

    const startTime = '2026-10-30T01:00:00.000Z';
    const endTime = '2026-10-30T02:00:00.000Z';

    it('创建任务', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/tasks')
        .set('x-user-id', userId)
        .send({ title: '写 e2e 测试', start_time: startTime, end_time: endTime })
        .expect(201);

      expect(response.body.title).toBe('写 e2e 测试');
      expect(response.body.user_id).toBe(userId);
      expect(response.body.completed).toBe(false);

      taskId = response.body.id;
    });

    it('按时间区间能查到刚创建的任务', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tasks')
        .query({ start: '2026-10-30T00:00:00.000Z', end: '2026-10-30T23:59:59.000Z' })
        .set('x-user-id', userId)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(taskId);
    });

    it('区间之外查不到', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tasks')
        .query({ start: '2026-11-01T00:00:00.000Z', end: '2026-11-02T00:00:00.000Z' })
        .set('x-user-id', userId)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('勾选完成', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/tasks/${taskId}`)
        .set('x-user-id', userId)
        .send({ completed: true })
        .expect(200);

      expect(response.body.completed).toBe(true);
    });

    it('删除任务', async () => {
      await request(app.getHttpServer())
        .delete(`/api/tasks/${taskId}`)
        .set('x-user-id', userId)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/tasks/${taskId}`)
        .set('x-user-id', userId)
        .expect(404);
    });
  });

  describe('habits 打卡幂等', () => {
    let habitId: string;

    it('创建习惯，未指定 frequency 时默认每日', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/habits')
        .set('x-user-id', userId)
        .send({ title: '晨间阅读', task_time: '07:30' })
        .expect(201);

      expect(response.body.frequency).toEqual({ type: 'daily' });
      // time 列要还原成 HH:mm:ss，而不是 1970-01-01 的时间戳
      expect(response.body.task_time).toBe('07:30:00');

      habitId = response.body.id;
    });

    it('同一天重复打卡只返回同一条记录', async () => {
      // 两个时间点都落在北京时间 2026-10-30 当天（09:00 与 17:00），
      // 若用 20:00Z 会跨到次日 04:00，属于另一个自然日，幂等不应生效
      const first = await request(app.getHttpServer())
        .post(`/api/habits/${habitId}/logs`)
        .set('x-user-id', userId)
        .send({ completed_at: '2026-10-30T01:00:00.000Z', log: '第一次' })
        .expect(201);

      const second = await request(app.getHttpServer())
        .post(`/api/habits/${habitId}/logs`)
        .set('x-user-id', userId)
        .send({ completed_at: '2026-10-30T09:00:00.000Z', log: '第二次' })
        .expect(201);

      expect(second.body.id).toBe(first.body.id);
      // 复用既有记录时不能覆盖原备注
      expect(second.body.log).toBe('第一次');
    });

    it('跨自然日打卡会新增记录', async () => {
      const nextDay = await request(app.getHttpServer())
        .post(`/api/habits/${habitId}/logs`)
        .set('x-user-id', userId)
        .send({ completed_at: '2026-10-30T20:00:00.000Z' })
        .expect(201);

      expect(nextDay.body.id).toBeTruthy();
    });

    it('按年份能查回打卡记录', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/habits/logs/year/2026')
        .set('x-user-id', userId)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('区间查询能命中当天记录（热力图数据源）', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/habits/logs')
        .query({ start: '2026-10-30T00:00:00.000Z', end: '2026-10-30T15:59:59.000Z' })
        .set('x-user-id', userId)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].habit_id).toBe(habitId);
    });
  });

  describe('方向页三级结构', () => {
    let goalId: string;
    let monthId: string;
    let goalDayId: string;

    it('创建分类与目标', async () => {
      const category = await request(app.getHttpServer())
        .post('/api/goal-categories')
        .set('x-user-id', userId)
        .send({ name: 'e2e 分类' })
        .expect(201);

      const goal = await request(app.getHttpServer())
        .post('/api/goals')
        .set('x-user-id', userId)
        .send({ title: 'e2e 目标', category_id: category.body.id })
        .expect(201);

      expect(goal.body.category_id).toBe(category.body.id);
      goalId = goal.body.id;
    });

    it('创建月度与日计划', async () => {
      const month = await request(app.getHttpServer())
        .post('/api/goal-months')
        .set('x-user-id', userId)
        .send({ goal_id: goalId, title: 'e2e 月度', month: '2026-10-01' })
        .expect(201);

      monthId = month.body.id;

      const goalDay = await request(app.getHttpServer())
        .post('/api/goal-days')
        .set('x-user-id', userId)
        .send({ goal_month_id: monthId, title: 'e2e 日计划', day: '2026-10-30', task_time: '09:00' })
        .expect(201);

      expect(goalDay.body.day).toBe('2026-10-30');
      expect(goalDay.body.task_time).toBe('09:00:00');
      goalDayId = goalDay.body.id;
    });

    it('overview 一次返回 goal → months → days，且日期已格式化', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/goals/overview')
        .set('x-user-id', userId)
        .expect(200);

      expect(response.body).toHaveLength(1);

      const goal = response.body[0];
      expect(goal.id).toBe(goalId);
      expect(goal.category.name).toBe('e2e 分类');
      expect(goal.months).toHaveLength(1);

      const month = goal.months[0];
      expect(month.month).toBe('2026-10-01');
      expect(month.days).toHaveLength(1);
      expect(month.days[0].day).toBe('2026-10-30');
      expect(month.days[0].status).toBe('active');
    });

    it('勾选日目标后 overview 里的 status 变成 completed', async () => {
      await request(app.getHttpServer())
        .patch(`/api/goal-days/${goalDayId}`)
        .set('x-user-id', userId)
        .send({ status: 'completed' })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/api/goals/overview')
        .set('x-user-id', userId)
        .expect(200);

      expect(response.body[0].months[0].days[0].status).toBe('completed');
    });

    it('by-date 返回当天日计划并带月度嵌套', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/goal-days/by-date')
        .query({ date: '2026-10-30' })
        .set('x-user-id', userId)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].goal_months.id).toBe(monthId);
    });
  });

  describe('总结', () => {
    it('创建日总结后能按日期命中', async () => {
      await request(app.getHttpServer())
        .post('/api/summaries')
        .set('x-user-id', userId)
        .send({
          kind: 'daily',
          period_start: '2026-10-30',
          period_end: '2026-10-30',
          title: 'e2e 总结',
          content: { done: '写完了', improve: '再快点', tomorrow: '继续', mood: '4' },
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/summaries/by-date')
        .query({ date: '2026-10-30', kind: 'daily' })
        .set('x-user-id', userId)
        .expect(200);

      expect(response.body.title).toBe('e2e 总结');
      expect(response.body.content.mood).toBe('4');
      expect(response.body.period_start.slice(0, 10)).toBe('2026-10-30');
    });
  });
});
