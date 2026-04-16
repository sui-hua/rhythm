import { computed, ref } from 'vue'

const SHOW_DELAY_MS = 200
const MIN_VISIBLE_MS = 300
const pendingCount = ref(0)
const visible = ref(false)
let showTimer = null
let hideTimer = null
let visibleAt = 0

function beginGlobalLoading() {
  pendingCount.value++
  if (pendingCount.value === 1) {
    showTimer = setTimeout(() => {
      visible.value = true
      visibleAt = Date.now()
    }, SHOW_DELAY_MS)
  }
}

function endGlobalLoading() {
  if (pendingCount.value <= 0) return
  pendingCount.value--
  if (pendingCount.value === 0) {
    clearTimeout(showTimer)
    const elapsed = Date.now() - visibleAt
    const remaining = MIN_VISIBLE_MS - elapsed
    if (remaining > 0) {
      hideTimer = setTimeout(() => {
        visible.value = false
      }, remaining)
    } else {
      visible.value = false
    }
  }
}

async function trackGlobalLoading(fn, options = {}) {
  beginGlobalLoading()
  try {
    return await fn()
  } finally {
    endGlobalLoading()
  }
}

function useGlobalLoading() {
  return {
    isGlobalLoading: computed(() => visible.value),
    globalPendingCount: computed(() => pendingCount.value)
  }
}

export { beginGlobalLoading, endGlobalLoading, trackGlobalLoading, useGlobalLoading }
