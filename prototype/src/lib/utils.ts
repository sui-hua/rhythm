import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化连续区间与离散日期的文案
export function formatMonthlyDays(days: number[]): string {
  if (!days || days.length === 0) return '未选日期'
  if (days.length === 31) return '每日 (1~31日)'

  const sorted = Array.from(new Set(days)).sort((a, b) => a - b)
  const ranges: string[] = []
  let rangeStart = sorted[0]
  let prev = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i]
    if (cur === prev + 1) {
      prev = cur
    } else {
      if (rangeStart === prev) {
        ranges.push(`${rangeStart}日`)
      } else {
        ranges.push(`${rangeStart}~${prev}日`)
      }
      rangeStart = cur
      prev = cur
    }
  }

  if (rangeStart === prev) {
    ranges.push(`${rangeStart}日`)
  } else {
    ranges.push(`${rangeStart}~${prev}日`)
  }

  const summary = ranges.slice(0, 3).join('、') + (ranges.length > 3 ? ' 等' : '')
  return `${summary} (共${days.length}天)`
}
