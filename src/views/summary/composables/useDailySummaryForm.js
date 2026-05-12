import { ref, watch } from 'vue'

/**
 * 日总结表单 Composable
 *
 * 负责管理日总结表单的数据状态与构建提交载荷。
 * 表单包含三个字段：done（今日完成）、improve（改进方向）、
 * tomorrow（明日计划）。
 *
 * 该 Composable 通过 watch 监听 initialDataRef 的变化，自动同步
 * 表单数据。适用于从已有数据（如编辑场景）初始化表单。
 *
 * @param {Ref<Object>} initialDataRef - 外部传入的初始数据引用，
 *   通常为当日总结记录的响应式数据。结构示例：
 *   {
 *     content: { done: '', improve: '', tomorrow: '' }
 *   }
 * @returns {
 *   {
 *     formData: Ref<Object>, - 表单数据对象，包含 done/improve/tomorrow
 *     buildPayload: Function - 返回当前表单数据的浅拷贝载荷
 *   }
 * }
 */
export const useDailySummaryForm = (initialDataRef) => {
  /**
   * 表单数据，包含三个字段：
   * - done: 今日完成内容
   * - improve: 改进方向
   * - tomorrow: 明日计划
   * @type {Ref<{done: string, improve: string, tomorrow: string}>}
   */
  const formData = ref({
    done: '',
    improve: '',
    tomorrow: ''
  })

  /**
   * 监听 initialDataRef 变化，自动同步表单数据
   *
   * 当外部传入的初始数据变化时（新增或编辑场景），
   * 解析数据并更新 formData。
   *
   * @param {WatchSource} initialDataRef - 被监听的初始数据响应式引用
   * @param {Function} callback - 数据变化时的回调函数，执行表单数据同步
   * @param {WatchOptions} { immediate: true } - 组件挂载时立即执行一次回调
   */
  watch(
    initialDataRef,
    (newVal) => {
      if (newVal) {
        const content = newVal.content && typeof newVal.content === 'object' && !Array.isArray(newVal.content)
          ? newVal.content
          : {}

        formData.value = {
          done: content.done ?? '',
          improve: content.improve ?? '',
          tomorrow: content.tomorrow ?? ''
        }
      } else {
        formData.value = { done: '', improve: '', tomorrow: '' }
      }
    },
    { immediate: true }
  )

  /**
   * 构建表单提交载荷
   * 
   * 将当前表单数据 formData 进行浅拷贝后返回，
   * 用于提交到后端接口。
   * 
   * @returns {Object} 当前表单数据的浅拷贝对象
   */
  const buildPayload = () => ({
    ...formData.value
  })

  /**
   * 返回的响应式状态与方法
   * @returns {
   *   {
   *     formData: Ref<Object>, - 表单数据引用
   *     buildPayload: Function - 构建提交载荷的方法
   *   }
   * }
   */
  return {
    formData,
    buildPayload
  }
}
