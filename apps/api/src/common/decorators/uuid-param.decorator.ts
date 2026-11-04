import { Param, ParseUUIDPipe } from '@nestjs/common';

/**
 * 路径里的 `:id` 参数。
 *
 * 校验放在 HTTP 边界上：非法 UUID 直接 400，而不是带着脏字符串进到 Prisma
 * 再被 PG 以 `invalid input syntax for type uuid` 拒绝（那会变成 500）。
 * 统一封装成一个装饰器，避免每条路由重复写 `new ParseUUIDPipe()`。
 */
export const UuidParam = (name = 'id'): ParameterDecorator =>
  Param(name, new ParseUUIDPipe());
