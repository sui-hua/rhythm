/**
 * useDayExecutionItems composable
 *
 * 从 src/utils/dayExecutionItems 重新导出纯函数 buildDayExecutionItems，
 * 保持原有 composable 接口不变，避免破坏已有调用方。
 */
export { buildDayExecutionItems } from '@/utils/dayExecutionItems'
export type { DayExecutionItemsInput } from '@/utils/dayExecutionItems'

import { buildDayExecutionItems } from '@/utils/dayExecutionItems'

/**
 * 日程表构建 composable 包装
 * 使用场景：组件中需要构建日程列表时
 */
export function useDayExecutionItems() {
    return { buildDayExecutionItems }
}
