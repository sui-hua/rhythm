/**
 * 跨模块共享的基础设施。
 *
 * 分层原则：这里只放「与具体业务无关、换掉数据库或换掉 HTTP 框架仍有意义」的东西。
 * 业务规则一律留在各模块的 service 里。
 */
export * from './decorators/current-user-id.decorator.js';
export * from './decorators/uuid-param.decorator.js';
export * from './http/api-exception.filter.js';
export * from './http/request-log.interceptor.js';
export * from './persistence/patch.js';
export * from './persistence/serializer.js';
export * from './time/columns.js';
