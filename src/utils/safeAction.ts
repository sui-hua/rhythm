/**
 * 统一的异步操作错误处理包装
 * 捕获错误并输出到 console，未来可接入 toast 通知
 */
export async function safeAction<T>(
  action: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await action()
  } catch (e) {
    console.error(errorMessage, e)
    return null
  }
}
