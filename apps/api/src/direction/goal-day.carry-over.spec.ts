import { carriesOver } from './goal-day.carry-over.js';

/**
 * 结转规则的边界用例。
 *
 * 这条规则决定「昨天没做完的日计划，今天还会不会出现在时间线上」，
 * 改动起来很容易顺手破坏其中一条，所以按三条前提各写一组。
 */
describe('carriesOver', () => {
  const target = '2026-10-30';

  it('当天项不需要结转判断，但也不会被判定为结转', () => {
    expect(carriesOver(target, 'active', 3, target)).toBe(false);
  });

  it('未完成且在回溯窗口内 → 结转', () => {
    expect(carriesOver('2026-10-29', 'active', 3, target)).toBe(true);
    expect(carriesOver('2026-10-27', 'active', 3, target)).toBe(true);
  });

  it('超出回溯窗口 → 不结转', () => {
    expect(carriesOver('2026-10-26', 'active', 3, target)).toBe(false);
  });

  it('已完成或被归档 → 不结转', () => {
    expect(carriesOver('2026-10-29', 'completed', 3, target)).toBe(false);
    expect(carriesOver('2026-10-29', 'archived', 3, target)).toBe(false);
  });

  it('所属目标未配置回溯天数 → 不结转', () => {
    expect(carriesOver('2026-10-29', 'active', 0, target)).toBe(false);
  });

  it('未来日期的记录不参与结转', () => {
    expect(carriesOver('2026-11-01', 'active', 30, target)).toBe(false);
  });
});
