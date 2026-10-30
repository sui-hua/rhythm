'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type AsyncState<T> = {
  data: T | null
  error: string | null
  loading: boolean
}

/**
 * 极简数据加载 hook。
 *
 * Next 端页面的数据都在浏览器侧取（后端已开 CORS），所以不需要 RSC 的缓存语义；
 * 为了避免给 web-next 增加依赖，这里用原生 fetch + 一个自增 version 实现重载。
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[]
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true })
  const [version, setVersion] = useState(0)

  // 用 ref 保存最新的 loader，避免把它放进依赖数组导致每次渲染都重新请求
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true }))

    loaderRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : '加载失败',
            loading: false
          })
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((prev) => prev + 1), [])

  return { ...state, reload }
}
