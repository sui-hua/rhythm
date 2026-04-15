import { ref, watch } from 'vue'

/**
 * 日总结表单 Composable
 * 管理表单数据（done/improve/tomorrow），处理初始数据回填
 */
export const useDailySummaryForm = (initialDataRef) => {
  const formData = ref({
    done: '',
    improve: '',
    tomorrow: ''
  })

  // 监听初始数据变化，解析 content 并回填表单
  watch(
    initialDataRef,
    (newVal) => {
      if (newVal && newVal.content) {
        try {
          formData.value = typeof newVal.content === 'string'
            ? JSON.parse(newVal.content)
            : { ...newVal.content }
        } catch (e) {
          console.error('Failed to parse summary content:', e)
          formData.value = { done: '', improve: '', tomorrow: '' }
        }
      } else {
        formData.value = { done: '', improve: '', tomorrow: '' }
      }
    },
    { immediate: true }
  )

  // 构建提交数据，将 formData 包装为 content 对象
  const buildPayload = () => ({
    content: { ...formData.value }
  })

  return {
    formData,
    buildPayload
  }
}
