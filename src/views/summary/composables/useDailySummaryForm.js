import { ref, watch } from 'vue'

export const useDailySummaryForm = (initialDataRef) => {
  const formData = ref({
    done: '',
    improve: '',
    tomorrow: '',
    mood: null
  })

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
          tomorrow: content.tomorrow ?? '',
          mood: newVal.mood ?? content.mood ?? null
        }
      } else {
        formData.value = { done: '', improve: '', tomorrow: '', mood: null }
      }
    },
    { immediate: true }
  )

  const buildPayload = () => ({
    ...formData.value
  })

  return {
    formData,
    buildPayload
  }
}
