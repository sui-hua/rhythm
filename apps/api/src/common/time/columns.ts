/**
 * 日期 / 时间列的读写与格式化。
 *
 * Prisma 把 PG 的三种时间类型统一读成 `Date`，但三者的语义完全不同：
 * - `date`        → UTC 零点（`2026-10-30T00:00:00.000Z`），只能取 UTC 部分
 * - `time`        → 1970-01-01 当天的某个时刻，只能取 UTC 时分秒
 * - `timestamptz` → 一个绝对时刻，取日期必须用进程时区
 *
 * 直接把它们交给 JSON 序列化会变成时间戳，与 Supabase 时期定下的跨端约定不一致。
 * 所以「怎么写进去、怎么读出来」全部收敛到本文件，避免各模块各写一套 `new Date()`。
 */

const ISO_DATE_LENGTH = 10;
const MS_PER_DAY = 86_400_000;

/* ------------------------------ 读：格式化 ------------------------------ */

/** Date → 进程本地时区的 `YYYY-MM-DD`（表达「哪一天」，而不是某个绝对时刻） */
export function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化 `date` 列：取 UTC 部分。
 * 库里存的是 UTC 零点，用本地时区取值会让西半球用户看到前一天。
 */
export function formatDateColumn(
  value: Date | null | undefined,
): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, ISO_DATE_LENGTH);
}

/**
 * 格式化 `timestamptz` 的日期部分：取进程时区。
 * `summary.period_start` 是按本地零点写入的，直接用 UTC 切片会差一天。
 */
export function formatLocalDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  return toDateOnly(value);
}

/** 格式化 `time` 列 → `HH:mm:ss`（库里是 UTC 基准，取 UTC 部分即原始时间） */
export function formatTimeColumn(
  value: Date | null | undefined,
): string | null {
  if (!value) return null;
  return value.toISOString().slice(11, 19);
}

/* ------------------------------ 写：解析 ------------------------------ */

/** 写入 `date` 列：字符串取前 10 位、Date 取本地日期，统一落到 UTC 零点 */
export function toDateColumn(value: string | Date): Date;
export function toDateColumn(value: string | Date | null): Date | null;
export function toDateColumn(
  value: string | Date | null | undefined,
): Date | null | undefined;
export function toDateColumn(
  value: string | Date | null | undefined,
): Date | null | undefined {
  if (value === null || value === undefined) return value;

  const text =
    typeof value === 'string'
      ? value.slice(0, ISO_DATE_LENGTH)
      : toDateOnly(value);
  return new Date(`${text}T00:00:00.000Z`);
}

/** 写入 `time` 列：`HH:mm` / `HH:mm:ss` → 1970-01-01 UTC，非法输入返回 null */
export function toTimeColumn(value: string): Date | null;
export function toTimeColumn(value: string | null): Date | null;
export function toTimeColumn(
  value: string | null | undefined,
): Date | null | undefined;
export function toTimeColumn(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (!value) return null;

  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;

  const [, hour, minute, second] = match;
  return new Date(
    Date.UTC(1970, 0, 1, Number(hour), Number(minute), Number(second ?? 0)),
  );
}

/**
 * 写入 `timestamptz`：ISO 字符串 → `Date`。
 *
 * 三态语义必须保留，否则 PATCH 里「没传」会被当成「清空」：
 * `undefined` → `undefined`（不动），`null` / `''` → `null`（清空）。
 */
export function toTimestamp(value: string): Date | null;
export function toTimestamp(value: string | null): Date | null;
export function toTimestamp(
  value: string | null | undefined,
): Date | null | undefined;
export function toTimestamp(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (!value) return null;
  return new Date(value);
}

/**
 * 日期字符串 → 进程时区零点。
 * 贴近 Supabase 里 `timestamptz` 与 `date` 字符串比较的行为，用于总结的区间命中。
 */
export function toLocalStart(value: string): Date {
  return value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
}

/** `toLocalStart` 的三态版本：`undefined` 不动、`null` 清空，供 PATCH 使用 */
export function toLocalStartOrNull(value: string): Date;
export function toLocalStartOrNull(value: string | null): Date | null;
export function toLocalStartOrNull(
  value: string | null | undefined,
): Date | null | undefined;
export function toLocalStartOrNull(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  return value === null ? null : toLocalStart(value);
}

/* ------------------------------ 区间计算 ------------------------------ */

/** 本地自然日起止，用于「同一自然日内只留一条打卡」的幂等判断 */
export function localDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
  const end = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

  return { start, end };
}

/** 日期加减天数，返回新对象，不修改入参 */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

/** 某个自然年的起止，用于按年查询打卡记录 */
export function yearRange(year: number): { start: Date; end: Date } {
  return {
    start: new Date(year, 0, 1, 0, 0, 0, 0),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
}

/** 两个 `YYYY-MM-DD` 之间相差多少天（to - from），用于结转窗口判定 */
export function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);

  return Math.round((end - start) / MS_PER_DAY);
}
