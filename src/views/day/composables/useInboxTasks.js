/**
 * @fileoverview useInboxTasks Composable
 * 
 * 提供日程视图中的任务收集（Inbox）功能。
 * Inbox 是指未分配具体时间的任务集合，与已安排时间的任务分开展示。
 * 
 * @module views/day/composables/useInboxTasks
 * @see {@link https://vuejs.org/api/reactivity-core.html| Vue Reactivity API}
 */

import { computed, ref } from 'vue'

/**
 * 将任务数组划分为"收集箱（Inbox）"和"已安排"两组。
 * 
 * 分类规则：
 * - **Inbox（收集箱）**：status === 'inbox' 或没有 start_time 的任务
 * - **Scheduled（已安排）**：status !== 'inbox' 且有 start_time 的任务
 * 
 * @param {Array<Object>} tasks - 任务对象数组，每个任务对象应包含 status 和 start_time 字段
 * @returns {{ inbox: Array<Object>, scheduled: Array<Object> }} 包含两个数组的对象
 * @returns {Array<Object>} return.inbox - 未安排时间的任务（收集箱）
 * @returns {Array<Object>} return.scheduled - 已安排时间的任务
 * 
 * @example
 * const tasks = [
 *   { id: 1, status: 'inbox', title: '思考一下' },
 *   { id: 2, status: 'todo', start_time: '2024-01-01 10:00', title: '会议' },
 *   { id: 3, status: 'done', title: '无时间任务' }
 * ]
 * const { inbox, scheduled } = partitionInboxTasks(tasks)
 * // inbox: [{ id: 1, ... }, { id: 3, ... }]
 * // scheduled: [{ id: 2, ... }]
 */
export function partitionInboxTasks(tasks) {
  return {
    inbox: tasks.filter((item) => item.status === 'inbox' || !item.start_time),
    scheduled: tasks.filter((item) => item.status !== 'inbox' && item.start_time)
  }
}

/**
 * 管理日程视图中的收集箱（Inbox）任务状态。
 * 
 * 这是 Vue 3 Composition API 风格的 composable，用于：
 * - 响应式地追踪收集箱任务的展开/折叠状态
 * - 从任务数组中分离出 Inbox 任务和已安排任务
 * 
 * @param {import('vue').Ref<Array<Object>>} tasksRef - 响应式任务数组引用
 * 
 * @returns {Object} 包含以下属性的对象：
 * @returns {import('vue').Ref<boolean>} expanded - 收集箱展开状态（默认 false）
 * @returns {import('vue').ComputedRef<Array<Object>>} inboxItems - 计算属性，返回所有未安排时间的任务
 * @returns {import('vue').ComputedRef<Array<Object>>} scheduledItems - 计算属性，返回所有已安排时间的任务
 * 
 * @example
 * const tasks = ref([...])
 * const { expanded, inboxItems, scheduledItems } = useInboxTasks(tasks)
 * // inboxItems.value  // => 未安排时间的任务数组
 * // scheduledItems.value  // => 已安排时间的任务数组
 */
export function useInboxTasks(tasksRef) {
  /** 收集箱展开/折叠状态，默认收起 */
  const expanded = ref(false)
  
  /** 根据 tasksRef 的值计算分组结果（缓存） */
  const groups = computed(() => partitionInboxTasks(tasksRef.value || []))

  return {
    /** 收集箱是否展开（UI 控制用） */
    expanded,
    /** 所有未安排时间的任务（收集箱内容） */
    inboxItems: computed(() => groups.value.inbox),
    /** 所有已安排时间的任务 */
    scheduledItems: computed(() => groups.value.scheduled)
  }
}
