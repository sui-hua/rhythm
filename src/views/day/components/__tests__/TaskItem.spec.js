import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const taskItemSource = readFileSync(resolve(process.cwd(), 'src/views/day/components/TaskItem.vue'), 'utf-8')

describe('TaskItem short-duration layout', () => {
  it('does not force extra minimum height on ultra-short timeline items', () => {
    expect(taskItemSource).not.toContain("minHeight: '28px'")
    expect(taskItemSource).not.toContain("min-h-[24px]")
  })
})
