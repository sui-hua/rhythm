/**
 * 更新载荷的构造工具。
 *
 * Prisma 的 update 语义是「字段缺席 = 不改，字段为 null = 清空」，
 * 所以「只带上调用方传了的字段」必须严格区分 `undefined` 与 `null`，
 * 不能用 `??` 兜底。`compact` 把这条约定固化成一行，替代逐字段 if 判断。
 */

/** 丢掉 `undefined`，保留 `null`（`null` 表示「显式清空」） */
export function compact<T extends Record<string, unknown>>(
  source: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  const result: { [K in keyof T]?: Exclude<T[K], undefined> } = {};

  for (const key of Object.keys(source) as (keyof T)[]) {
    const value = source[key];
    if (value !== undefined)
      result[key] = value as Exclude<T[typeof key], undefined>;
  }

  return result;
}

/**
 * 关系字段的三态：`undefined` 不动、`null` 断开、有值则连接。
 *
 * 与 `compact` 配合使用：
 * ```ts
 * compact({ goal_months: relation(dto.goal_month_id) })
 * ```
 */
export function relation(id: string | null | undefined) {
  if (id === undefined) return undefined;

  return id === null ? { disconnect: true as const } : { connect: { id } };
}
