import {
  formatDateColumn,
  formatLocalDate,
  formatTimeColumn,
} from '../time/columns.js';

/**
 * 数据库行 → API 响应 的声明式序列化。
 *
 * 早期版本按「字段名」全局猜类型（凡叫 `day` / `month` 就当 date 列），
 * 一旦某张表出现同名的 timestamptz 就会静默出错，而且嵌套对象要逐个手写映射。
 * 现在改成每个实体声明一份 spec：类型写在实体旁边，读代码时一眼能对上 schema。
 */

type Row = Record<string, unknown>;

export type SerializerSpec = {
  /** `date` 列 → `YYYY-MM-DD`（按 UTC 取值） */
  date?: readonly string[];
  /** `time` 列 → `HH:mm:ss` */
  time?: readonly string[];
  /** 本地零点写入的 `timestamptz` → 按进程时区取 `YYYY-MM-DD` */
  localDate?: readonly string[];
  /** JSON 列 → 对象（存成字符串时自动解析，空值归一为 `{}`） */
  json?: readonly string[];
  /** 空值回落，如 `{ updated_at: 'created_at' }` */
  fallback?: Readonly<Record<string, string>>;
  /** 输出白名单；不写则原样输出全部字段 */
  pick?: readonly string[];
};

export type EntitySerializer = {
  one: (row: Row) => Row;
  many: (rows: Row[]) => Row[];
};

/** JSON 列归一化：`null` / 空串 / 非法 JSON 一律给 `{}`，避免前端拿到三种空值 */
function normalizeJson(value: unknown): Record<string, unknown> {
  if (!value) return {};

  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  return typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function defineSerializer(spec: SerializerSpec): EntitySerializer {
  const dateFields = new Set(spec.date ?? []);
  const timeFields = new Set(spec.time ?? []);
  const localDateFields = new Set(spec.localDate ?? []);
  const jsonFields = new Set(spec.json ?? []);
  const fallback = spec.fallback ?? {};

  function format(key: string, value: unknown): unknown {
    if (!(value instanceof Date)) return value;

    if (dateFields.has(key)) return formatDateColumn(value);
    if (timeFields.has(key)) return formatTimeColumn(value);
    if (localDateFields.has(key)) return formatLocalDate(value);

    return value.toISOString();
  }

  function one(row: Row): Row {
    const keys = spec.pick ?? Object.keys(row);
    const result: Row = {};

    for (const key of keys) {
      let value = row[key];

      const fallbackKey = fallback[key];
      if (value === undefined && fallbackKey) value = row[fallbackKey];

      const formatted = format(key, value);
      result[key] = jsonFields.has(key) ? normalizeJson(formatted) : formatted;
    }

    return result;
  }

  return {
    one,
    many: (rows) => rows.map(one),
  };
}
