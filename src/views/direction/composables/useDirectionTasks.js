/**
 * @fileoverview Direction 模块 - 任务更新业务逻辑 Composable
 *
 * 提供每日任务（dailyPlans）的更新能力，封装数据库持久化与响应式状态同步逻辑。
 * 采用经典的"数据库写入 + 内存状态同步"双写模式，确保 UI 即时响应。
 *
 * @module views/direction/composables/useDirectionTasks
 * @see {@link https://github.com/orgs/rhythm/projects} 项目管理视图
 * @requires db - 底层数据库服务（Dexie/Supabase）
 * @requires useDirectionState - 响应式状态（dailyTasks 字典）
 */

/**
 * @import { db } 从 @/services/database 引入数据库服务实例
 * 提供 db.dailyPlans.update() 等 CRUD 操作
 */
import { db } from '@/services/database'

/**
 * @import { useDirectionState } 从同目录 composable 引入方向状态
 * @property {dailyTasks} Object<id, DailyPlan> 每日任务响应式字典
 */
import { useDirectionState } from '@/views/direction/composables/useDirectionState'

/**
 * Direction 模块任务管理 Composable
 *
 * 核心职责：
 * 1. 接收组件传来的 task 对象和 payload 更新字段
 * 2. 将变更持久化到 Supabase 数据库（db.dailyPlans.update）
 * 3. 同步更新本地 Pinia 响应式状态（dailyTasks），触发 UI 自动刷新
 *
 * 使用场景：
 * - 用户在日历/时间轴视图中编辑任务标题、时间、时长时调用
 * - 常与 useDirectionState 搭配使用，后者提供 dailyTasks 读取
 *
 * @returns {Object} 暴露任务操作方法给组件使用
 * @returns {Function} returns.handleUpdateTask - 更新单条任务的处理器
 *
 * @example
 * const { handleUpdateTask } = useDirectionTasks()
 * await handleUpdateTask(existingTask, { title: '新标题', duration: 90 })
 */
export function useDirectionTasks() {
  // 从全局状态获取响应式任务字典，用于内存层同步更新
  const { dailyTasks } = useDirectionState()

  /**
   * 更新单条每日任务（二元签名模式）
   *
   * 执行"数据库持久化 + 状态同步"两步操作：
   * - Step 1: 调用 db.dailyPlans.update 将变更写入 Supabase
   * - Step 2: 遍历 dailyTasks 字典，按 id 找到匹配项并合并 payload
   *
   * 采用"先写数据库、后同步内存"的策略，保证数据最终一致；
   * 即使内存同步失败，数据库写入成功则数据不丢失。
   *
   * @param {Object} task - 当前要更新的任务对象（源记录）
   * @param {string|number} task.id - 任务唯一标识（对应 dailyPlans.id）
   * @param {string} [task.title] - 原任务标题（payload 未提供时保留）
   * @param {string} [task.task_time] - 原任务时间（payload 未提供时保留）
   * @param {number} [task.duration] - 原任务时长分钟数（payload 未提供时保留）
   *
   * @param {Object} payload - 需要更新的字段集合（Partial 更新）
   * @param {string} [payload.title] - 新任务标题（可选）
   * @param {string} [payload.task_time] - 新任务时间（可选）
   * @param {number} [payload.duration] - 新任务时长分钟数（可选）
   *
   * @returns {Promise<void>} 无返回值；操作结果通过 try/catch 捕获并打印
   *
   * @throws {Error} 数据库更新失败时捕获并 console.error，不向上抛出
   *                  以避免阻塞 UI 更新流程
   *
   * @example
   * // 更新任务标题和时长，保留原时间
   * await handleUpdateTask(
   *   { id: 123, title: '旧标题', task_time: '09:00', duration: 60 },
   *   { title: '新标题', duration: 90 }
   * )
   */
  const handleUpdateTask = async (task, payload) => {
    if (!task || !task.id) return
    try {
      await db.dailyPlans.update(task.id, {
        title: payload.title ?? task.title,
        task_time: payload.task_time ?? task.task_time,
        duration: payload.duration ?? task.duration
      })

      // 同步兼容层：遍历找 id 匹配项并更新
      for (const [k, v] of Object.entries(dailyTasks)) {
        if (v.id === task.id) {
          dailyTasks[k] = { ...v, ...payload }
          break
        }
      }
    } catch (e) {
      console.error('Failed to update task', e)
    }
  }

  return {
    handleUpdateTask
  }
}
