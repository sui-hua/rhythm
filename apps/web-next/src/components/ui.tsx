import { useEffect, useState } from 'react'
import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

/**
 * 只在浏览器挂载后才渲染 children。
 *
 * Next 16 的 Cache Components 会在预渲染阶段执行 Client Component，
 * 页面里一旦出现 `new Date()` 就会报「unstable value」。
 * 把依赖「当前时间」的内容放到挂载之后渲染，既避免预渲染报错，
 * 也保证首屏时间不会在构建时被固化。
 */
export function ClientOnly({ children, fallback }: PropsWithChildren<{ fallback?: ReactNode }>) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <>{fallback ?? null}</>

  return <>{children}</>
}

export function Card({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 shadow-sm', className)}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, extra }: PropsWithChildren<{ extra?: ReactNode }>) {
  return (
    <div className="flex items-center justify-between px-1 pb-3 pt-6">
      <h2 className="text-base font-bold tracking-tight">{children}</h2>
      {extra}
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const styles = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'bg-muted text-foreground hover:bg-border',
    ghost: 'text-muted-foreground hover:bg-muted',
    danger: 'border border-danger/30 text-danger hover:bg-danger/5'
  }[variant]

  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        styles,
        className
      )}
    />
  )
}

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
    </div>
  )
}

export function StatusPill({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: 'neutral' | 'success' }>) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tone === 'success' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({ children }: PropsWithChildren) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5">
      <span className="text-sm font-semibold text-danger">{message}</span>
      {onRetry ? (
        <Button variant="ghost" onClick={onRetry} className="px-2 py-1 text-danger">
          重试
        </Button>
      ) : null}
    </div>
  )
}

export function CheckCircle({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={checked}
      onClick={onClick}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition',
        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-muted-foreground'
      )}
    >
      {checked ? (
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3.5}>
          <path d="M4 12.5 9.5 18 20 6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  )
}
