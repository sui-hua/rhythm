import React from 'react'
import { BookOpen, CircleCheck, Compass, LayoutGrid } from 'lucide-react'
import type { NavItem, TabKey } from '../types'
import { cn } from '../lib/utils'

interface TabBarProps {
  currentTab: TabKey
  items: NavItem[]
  onChangeTab: (tab: TabKey) => void
}

export const TabBar: React.FC<TabBarProps> = ({ currentTab, items, onChangeTab }) => {
  const renderIcon = (iconName: string, active: boolean) => {
    const props = {
      size: 22,
      strokeWidth: active ? 2.3 : 1.7,
      className: cn('transition-all duration-200', active ? 'scale-110' : 'group-hover:scale-105')
    }

    switch (iconName) {
      case 'LayoutGrid':
        return <LayoutGrid {...props} />
      case 'CircleCheck':
        return <CircleCheck {...props} />
      case 'Compass':
        return <Compass {...props} />
      case 'BookOpen':
        return <BookOpen {...props} />
      default:
        return <LayoutGrid {...props} />
    }
  }

  return (
    <div>
      <nav className="absolute bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-t border-zinc-200/70 pt-2.5 pb-6 px-6 flex items-center justify-around shadow-[0_-2px_12px_rgba(0,0,0,0.03)]">
        {items.map((nav) => {
          const isActive = currentTab === nav.key
          return (
            <button
              key={nav.key}
              onClick={() => onChangeTab(nav.key)}
              title={nav.name}
              className={cn(
                'w-12 h-10 flex items-center justify-center transition-all duration-200 group active:scale-90',
                isActive ? 'text-zinc-950' : 'text-zinc-400 hover:text-zinc-700'
              )}
            >
              {renderIcon(nav.icon, isActive)}
            </button>
          )
        })}
      </nav>

      {/* 底部原生 Home Bar 手势指示条 */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-300 rounded-full pointer-events-none z-50"></div>
    </div>
  )
}
