import { describe, expect, it } from 'vitest'
import { uiGrammar } from '@/config/uiGrammar'

describe('uiGrammar', () => {
  it('defines shared shell spacing and panel tokens', () => {
    expect(uiGrammar.page.maxWidth).toBe('1440px')
    expect(uiGrammar.panel.radius).toBe('1.5rem')
    expect(uiGrammar.section.eyebrowTracking).toBe('0.2em')
  })
})
