import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * 当前用户 ID。
 *
 * 目前从 `x-user-id` 请求头读取，作为认证模块落地前的过渡方案。
 * 线上库的 user_id 原本由 Supabase Auth + RLS 保证，自托管后必须由应用层显式过滤，
 * 所以每个查询都要带上它——接入 JWT 后只需改这一个装饰器的取值来源。
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const raw = request.headers['x-user-id'];
    const userId = Array.isArray(raw) ? raw[0] : raw;

    if (!userId) {
      throw new UnauthorizedException('缺少 x-user-id 请求头');
    }

    return userId;
  },
);
