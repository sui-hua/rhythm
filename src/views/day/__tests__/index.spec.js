import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const dayViewSource = readFileSync(resolve(process.cwd(), 'src/views/day/index.vue'), 'utf-8')

describe('Day view page chrome', () => {
  it('does not render the intro banner above the timeline', () => {
    expect(dayViewSource).not.toContain('<PageIntroBanner')
    expect(dayViewSource).not.toContain("import PageIntroBanner from '@/components/PageIntroBanner.vue'")
  })
})
