/**
 * @fileOverview 用户作用域（User Scope）工具模块
 * 提供基于用户 ID 的数据隔离功能，确保用户只能访问自己的数据。
 * 
 * 在 Supabase + RLS（行级安全策略）架构中，此模块作为应用层的补充过滤机制，
 * 显式注入 user_id 条件到数据库查询中，配合 RLS 双重保障数据安全。
 * 
 * @module services/db/withUserScope
 */

/**
 * Resolves explicit user id before falling back to auth state.
 * 
 * 解析用户 ID 的优先级规则：
 * 1. 优先使用函数调用时显式传入的 `explicitUserId`（如 API 参数）
 * 2. 若无显式 ID，回退到认证状态中的 `authUserId`（如 authStore）
 * 3. 若两者都不可用，抛出错误
 * 
 * 此设计允许调用方灵活覆盖用户上下文，同时保留自动使用当前登录用户的便捷性。
 * 
 * @param {string|null} explicitUserId - 显式指定的 user id，通常来自函数调用参数
 * @param {string|null} authUserId - 认证状态中的 user id，通常来自 authStore
 * @returns {string} 解析后的 user id
 * @throws {Error} 当 explicitUserId 和 authUserId 都为 null/undefined 时抛出
 * 
 * @example
 * // 显式指定用户（管理员场景）
 * const userId = resolveScopedUserId(targetUserId, authStore.userId)
 * 
 * @example
 * // 使用当前登录用户
 * const userId = resolveScopedUserId(null, authStore.userId)
 */
export function resolveScopedUserId(explicitUserId, authUserId) {
  const userId = explicitUserId || authUserId
  if (!userId) throw new Error('缺少 userId，无法执行带用户隔离的数据查询')
  return userId
}

/**
 * Injects user_id filter into a query builder.
 * 
 * 将 `user_id = ${userId}` 条件注入到 Supabase 查询构建器中，
 * 实现基于用户的数据隔离。此函数是 applyUserScope 模式的核心，
 * 与 RLS（行级安全策略）配合形成双重数据保护。
 * 
 * 使用方式：在调用 Supabase 查询方法（如 `.select()`、`.update()`、`.delete()`）后，
 * 链式调用此方法添加用户过滤条件。
 * 
 * @param {string} userId - 用于限定查询范围的 user id
 * @param {Object} query - Supabase query builder 实例（如 `supabase.from('tasks').select()`）
 * @returns {Object} 注入了 user_id 过滤条件的查询构建器
 * 
 * @example
 * // 查询当前用户的所有任务
 * const { data } = await applyUserScope(userId, supabase.from('tasks').select('*'))
 * 
 * @example
 * // 更新当前用户的任务
 * await applyUserScope(userId, supabase.from('tasks').update({ done: true }).eq('id', taskId))
 */
export function applyUserScope(userId, query) {
  return query.eq('user_id', userId)
}
