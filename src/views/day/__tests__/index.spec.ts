import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// 读取 Day 视图源码用于静态分析
const dayViewSource: string = readFileSync(resolve(process.cwd(), 'src/views/day/index.vue'), 'utf-8')

describe('Day view page chrome', () => {
  it('does not render the intro banner above the timeline', () => {
    expect(dayViewSource).not.toContain('<PageIntroBanner')
    expect(dayViewSource).not.toContain("import PageIntroBanner from '@/components/PageIntroBanner.vue'")
  })

  it('uses the notification prompt card instead of requesting permission on mount', () => {
    const mountedBlock = dayViewSource.match(/onMounted\((?:async\s*)?\(\) => \{([\s\S]*?)\n\}\)/)?.[1] ?? ''

    expect(dayViewSource).toContain('<NotificationPromptCard')
    expect(dayViewSource).toContain('@enable="handleEnableNotifications"')
    expect(dayViewSource).toContain("import NotificationPromptCard from '@/components/notifications/NotificationPromptCard.vue'")
    expect(mountedBlock).not.toMatch(/requestPermission\(\)/)
  })

  it('shares one daily report instance between navigation trigger and modal state', () => {
    expect(dayViewSource).toMatch(/const\s+dailyReport\s*=\s*useDailyReport\(\)/)
    expect(dayViewSource).toMatch(/useDayNavigation\(\{\s*dailyReport\s*\}\)/)
    expect(dayViewSource).toContain('const { reportVisible, reportStats, closeReport } = dailyReport')
  })
})

