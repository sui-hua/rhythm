import { describe, expect, it, vi } from 'vitest'
import { useActionLock } from '@/composables/useActionLock'

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe('useActionLock', () => {
  it('pending 时重复调用只执行一次', async () => {
    const gate = deferred<string>()
    const action = vi.fn(() => gate.promise)
    const { withLock, isSubmitting } = useActionLock()
    const lockedAction = withLock(action)

    const first = lockedAction()
    const second = lockedAction()

    expect(isSubmitting.value).toBe(true)
    expect(action).toHaveBeenCalledTimes(1)
    await expect(second).resolves.toBeUndefined()

    gate.resolve('done')

    await expect(first).resolves.toBe('done')
    expect(isSubmitting.value).toBe(false)
  })

  it('失败后释放锁并抛出原始错误', async () => {
    const err = new Error('write failed')
    const { withLock, isSubmitting } = useActionLock()
    const lockedAction = withLock(async () => {
      throw err
    })

    await expect(lockedAction()).rejects.toBe(err)
    expect(isSubmitting.value).toBe(false)
  })
})
