import { computed, ref, watch } from 'vue'

/**
 * 通用总结表单 Composable（周/月/年）
 * 管理单字段 content，根据 type 计算显示名称
 */
export const useGenericSummaryForm = (initialDataRef, typeRef) => {
  const content = ref('')

  // 监听初始数据变化，回填 content
  watch(
    initialDataRef,
    (newVal) => {
      if (newVal) {
        content.value = newVal.content
      } else {
        content.value = ''
      }
    },
    { immediate: true }
  )

  // 根据 type 计算中文名称
  const typeName = computed(() => {
    if (typeRef.value === 'week') return '周'
    if (typeRef.value === 'month') return '月'
    return '年'
  })

  const placeholderText = computed(() => `在这里写下您的${typeName.value}总结...`)

  const buildPayload = () => ({
