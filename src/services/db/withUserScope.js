/**
 * Resolves explicit user id before falling back to auth state.
 * @param {string|null} explicitUserId - Explicit user id passed to a function
 * @param {string|null} authUserId - User id from auth store
 * @returns {string} Resolved user id
 * @throws {Error} If no userId available
 */
export function resolveScopedUserId(explicitUserId, authUserId) {
  const userId = explicitUserId || authUserId
  if (!userId) throw new Error('缺少 userId，无法执行带用户隔离的数据查询')
  return userId
}

/**
 * Injects user_id filter into a query builder.
 * @param {string} userId - User id to scope the query
 * @param {Object} query - Supabase query builder
 * @returns {Object} Query with user scope applied
 */
export function applyUserScope(userId, query) {
  return query.eq('user_id', userId)
}
