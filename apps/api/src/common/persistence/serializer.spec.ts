import { defineSerializer } from './serializer.js';

/**
 * 序列化器的行为约定。
 *
 * 跨端字段格式全靠这里，前端的日期解析、热力图分组、总结回填都建立在
 * 「date 列是 YYYY-MM-DD、time 列是 HH:mm:ss」之上，改动必须有测试兜住。
 */
describe('defineSerializer', () => {
  const serializer = defineSerializer({
    date: ['day'],
    time: ['task_time'],
    localDate: ['period_start'],
    json: ['content'],
    fallback: { updated_at: 'created_at' },
  });

  const createdAt = new Date('2026-10-30T02:00:00.000Z');

  it('date 列按 UTC 取日期，不随进程时区漂移', () => {
    const row = serializer.one({ day: new Date('2026-10-30T00:00:00.000Z') });

    expect(row.day).toBe('2026-10-30');
  });

  it('time 列还原成 HH:mm:ss', () => {
    const row = serializer.one({
      task_time: new Date('1970-01-01T07:30:00.000Z'),
    });

    expect(row.task_time).toBe('07:30:00');
  });

  it('localDate 按进程时区取日期，避免本地零点写入的 timestamptz 差一天', () => {
    const row = serializer.one({
      period_start: new Date(2026, 9, 30, 0, 0, 0),
    });

    expect(row.period_start).toBe('2026-10-30');
  });

  it('其余 Date 字段输出 ISO 字符串', () => {
    const row = serializer.one({ created_at: createdAt });

    expect(row.created_at).toBe('2026-10-30T02:00:00.000Z');
  });

  it('JSON 列：对象原样、字符串解析、空值归一成 {}', () => {
    expect(serializer.one({ content: { mood: '4' } }).content).toEqual({
      mood: '4',
    });
    expect(serializer.one({ content: '{"mood":"4"}' }).content).toEqual({
      mood: '4',
    });
    expect(serializer.one({ content: null }).content).toEqual({});
    expect(serializer.one({ content: 'not-json' }).content).toEqual({});
  });

  it('fallback 在字段缺失时回落到备用字段', () => {
    const row = serializer.one({
      updated_at: undefined,
      created_at: createdAt,
    });

    expect(row.updated_at).toBe('2026-10-30T02:00:00.000Z');
  });

  it('pick 只输出白名单字段', () => {
    const picked = defineSerializer({ pick: ['id', 'day'], date: ['day'] });
    const row = picked.one({
      id: 'a',
      day: new Date('2026-10-30T00:00:00.000Z'),
      user_id: 'u',
    });

    expect(Object.keys(row).sort()).toEqual(['day', 'id']);
  });

  it('many 逐条套用同一套规则', () => {
    const rows = serializer.many([
      { day: new Date('2026-10-30T00:00:00.000Z') },
      { day: new Date('2026-10-31T00:00:00.000Z') },
    ]);

    expect(rows.map((row) => row.day)).toEqual(['2026-10-30', '2026-10-31']);
  });
});
