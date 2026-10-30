/**
 * 数据库行 → API 响应 的字段级转换。
 *
 * Prisma 会把 `date` / `time` 列读成 Date 对象，直接 JSON 序列化会变成
 * `2026-10-29T00:00:00.000Z` 或 `1970-01-01T09:00:00.000Z`，
 * 而 Supabase 返回的是 `2026-10-29` 和 `09:00:00`。
 * 为保持与 web / mobile 现有代码的字段格式一致，这里按字段名显式转换。
 */

/** 只取日期部分（对应 PG 的 date 列） */
const DATE_ONLY_FIELDS = new Set(['day', 'month', 'year', 'report_date']);

/** 只取时间部分（对应 PG 的 time 列） */
const TIME_FIELDS = new Set(['task_time']);

export function formatDateOnly(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

/**
 * 按进程本地时区取日期部分。
 *
 * `date` 列被 Prisma 读成 UTC 零点，用 toISOString 取日期是对的；
 * 但 `timestamptz` 若按本地零点写入（如北京时间 2026-10-30 00:00），
 * 转成 ISO 会变成 2026-10-29T16:00Z，直接切片会差一天。
 * summary.period_start / period_end 就是这种情况。
 */
export function formatLocalDateOnly(value: Date | null | undefined): string | null {
  if (!value) return null;

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeOfDay(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString().slice(11, 19);
}

/** 把 'HH:mm' 或 'HH:mm:ss' 转成 Prisma 能写入 time 列的 Date（以 UTC 为零点基准） */
export function parseTimeOfDay(value: string | null | undefined): Date | null {
  if (!value) return null;

  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;

  const [, h, m, s] = match;
  return new Date(Date.UTC(1970, 0, 1, Number(h), Number(m), Number(s ?? 0)));
}

/** 按字段名转换一行记录，未知字段原样保留 */
export function serializeRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const result: Record<string, unknown> = { ...row };

  for (const key of Object.keys(result)) {
    const value = result[key];
    if (!(value instanceof Date)) continue;

    if (DATE_ONLY_FIELDS.has(key)) {
      result[key] = formatDateOnly(value);
    } else if (TIME_FIELDS.has(key)) {
      result[key] = formatTimeOfDay(value);
    } else {
      result[key] = value.toISOString();
    }
  }

  return result;
}

export function serializeRows<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[] {
  return rows.map(serializeRow);
}
