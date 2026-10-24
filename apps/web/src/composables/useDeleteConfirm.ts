/**
 * 删除二次确认统一入口
 *
 * 使用场景：任务、习惯、目标、分类、总结等危险删除操作。
 * 数据流：调用方传入删除类型 → 解析确认文案 → 浏览器确认框返回用户选择。
 */

// 删除确认支持的业务类型
export type DeleteConfirmType = 'task' | 'habit' | 'goal' | 'category' | 'summary' | 'goalDayBatch'

// 删除确认参数，count 用于批量删除时提示影响数量
export interface DeleteConfirmOptions {
  type: DeleteConfirmType
  count?: number
}

// 各删除场景的默认确认文案，目标删除需明确提示级联影响
const DELETE_CONFIRM_MESSAGES: Record<Exclude<DeleteConfirmType, 'goalDayBatch'>, string> = {
  task: '确定要删除这个任务吗？删除后无法恢复。',
  habit: '确定要删除这个习惯吗？删除后相关打卡记录也会失去关联，且无法恢复。',
  goal: '确定要删除这个目标吗？删除后关联的月计划和日计划也会一并删除，且无法恢复。',
  category: '确定要删除这个类型吗？删除后相关目标会变为未分类。',
  summary: '确定要删除这条总结吗？删除后无法恢复。'
}

// 根据删除参数构建最终展示给用户的确认文案
function buildDeleteConfirmMessage(options: DeleteConfirmOptions): string {
  if (options.type === 'goalDayBatch') {
    const countText = options.count && options.count > 0 ? ` ${options.count} 条` : ''
    return `确定要删除选中的${countText}日计划吗？删除后无法恢复。`
  }

  return DELETE_CONFIRM_MESSAGES[options.type]
}

/**
 * 弹出删除二次确认
 *
 * @param typeOrOptions - 删除类型，或包含类型和数量的配置
 * @returns 用户确认时返回 true，取消时返回 false
 */
export function confirmDelete(typeOrOptions: DeleteConfirmType | DeleteConfirmOptions): boolean {
  const options = typeof typeOrOptions === 'string' ? { type: typeOrOptions } : typeOrOptions
  return globalThis.confirm(buildDeleteConfirmMessage(options))
}
