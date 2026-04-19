import { describe, expect, it } from 'vitest'
import { pageNarratives, getPageNarrative } from '@/config/pageNarratives'

describe('page narratives', () => {
  it('defines copy for the four primary modules', () => {
    expect(Object.keys(pageNarratives)).toEqual(['day', 'habits', 'direction', 'summary'])
    expect(getPageNarrative('day').title).toBe('时序')
    expect(getPageNarrative('habits').title).toBe('习惯')
    expect(getPageNarrative('direction').title).toBe('所向')
    expect(getPageNarrative('summary').title).toBe('总结')
  })
})
