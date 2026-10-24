import { ref } from 'vue'
import type { Ref } from 'vue'

type AsyncAction<Args extends unknown[], Result> = (...args: Args) => Promise<Result>

export interface UseActionLockReturn {
  isSubmitting: Ref<boolean>
  withLock: <Args extends unknown[], Result>(action: AsyncAction<Args, Result>) => (...args: Args) => Promise<Result | undefined>
}

/**
 * 写操作提交锁。
 *
 * 使用场景：新增、编辑、删除、打卡等网络写入操作。
 * 数据流：用户触发 → 锁定按钮/忽略重复触发 → 请求完成后释放。
 */
export function useActionLock(): UseActionLockReturn {
  // 当前是否存在尚未完成的写操作，用于禁用按钮并阻止重复提交
  const isSubmitting = ref(false)

  // 包装异步写操作，pending 期间的重复触发静默忽略
  function withLock<Args extends unknown[], Result>(action: AsyncAction<Args, Result>) {
    return async (...args: Args): Promise<Result | undefined> => {
      if (isSubmitting.value) return undefined

      isSubmitting.value = true
      try {
        return await action(...args)
      } finally {
        isSubmitting.value = false
      }
    }
  }

  return {
    isSubmitting,
    withLock
  }
}
