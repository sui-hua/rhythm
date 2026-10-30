'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from './ui'

const NAV = [
  { href: '/day', label: '时序', hint: 'Day' },
  { href: '/habits', label: '习惯', hint: 'Habits' },
  { href: '/direction', label: '所向', hint: 'Direction' },
  { href: '/summary', label: '总结', hint: 'Summary' }
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <aside className="flex w-full shrink-0 flex-row gap-1 border-b border-border bg-card px-4 py-3 md:h-screen md:w-56 md:flex-col md:border-b-0 md:border-r md:px-4 md:py-6">
      <div className="hidden items-center gap-2 px-2 pb-6 md:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-foreground">
          <span className="h-1 w-1 rounded-full bg-foreground" />
        </span>
        <span className="text-lg font-extrabold tracking-tight">Rhythm</span>
      </div>

      <nav className="flex flex-1 flex-row gap-1 md:flex-col">
        {NAV.map((item) => {
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center rounded-xl px-3 py-2 text-sm font-semibold transition md:flex-none md:flex-row md:justify-between',
                active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
              )}
            >
              <span>{item.label}</span>
              <span className={cn('text-[11px] md:text-xs', active ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {item.hint}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
