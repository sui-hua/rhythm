import { describe, expect, it } from 'vitest'
import {
  getMobileOverlayClass,
  getMobileSidebarShellClass,
  getSidebarMotionClass,
  getSidebarPanelClass
} from '@/views/day/composables/mobileLayers'

describe('getSidebarPanelClass', () => {
  it('keeps the mobile sidebar content shell simple to avoid a separate paint layer', () => {
    const classes = getSidebarPanelClass({ isMobile: true, show: true })

    expect(classes).toContain('bg-background')
    expect(classes).toContain('h-full')
    expect(classes).not.toContain('fixed')
  })

  it('keeps the desktop sidebar in the normal page stacking context', () => {
    const classes = getSidebarPanelClass({ isMobile: false, show: false })

    expect(classes).toContain('z-20')
    expect(classes).not.toContain('z-50')
  })
})

describe('getMobileOverlayClass', () => {
  it('renders the overlay below the mobile sidebar', () => {
    expect(getMobileOverlayClass()).toContain('z-[40]')
  })
})

describe('getSidebarMotionClass', () => {
  it('uses slide-only motion on mobile to avoid the white fade-in flash', () => {
    const classes = getSidebarMotionClass({ isMobile: true, show: false, isReady: true })

    expect(classes).toContain('-translate-x-full')
    expect(classes).not.toContain('opacity-0')
    expect(classes).not.toContain('opacity-100')
  })

  it('keeps desktop readiness opacity behavior unchanged', () => {
    const classes = getSidebarMotionClass({ isMobile: false, show: true, isReady: false })

    expect(classes).toContain('opacity-0')
  })
})

describe('getMobileSidebarShellClass', () => {
  it('animates the mobile shell as one fixed layer', () => {
    const classes = getMobileSidebarShellClass({ show: false })

    expect(classes).toContain('fixed')
    expect(classes).toContain('z-50')
    expect(classes).toContain('-translate-x-full')
  })
})
