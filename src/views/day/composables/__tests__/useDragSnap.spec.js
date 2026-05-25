import { describe, expect, it } from 'vitest'
import { pxToHour, hourToPx, calcDragResult, calcResizeResult } from '@/views/day/composables/useDragSnap'

describe('useDragSnap', () => {
  describe('pxToHour', () => {
    it('converts pixels to hours snapped to 5-minute increments', () => {
      // 180px = 1 hour, 15px = 5 minutes = 0.08333h
      expect(pxToHour(0)).toBe(0)
      expect(pxToHour(180)).toBe(1)
      expect(pxToHour(90)).toBe(0.5)
      expect(pxToHour(15)).toBe(5 / 60) // 5 minutes
    })

    it('snaps to nearest 5-minute boundary', () => {
      // 7px = 0.0389h → rounds to 0 intervals → 0
      expect(pxToHour(7)).toBe(0)
      // 20px = 0.1111h → rounds to 1 interval → 0.08333h (5 min)
      expect(pxToHour(20)).toBe(5 / 60)
    })
  })

  describe('hourToPx', () => {
    it('converts hours to pixels', () => {
      expect(hourToPx(0)).toBe(0)
      expect(hourToPx(1)).toBe(180)
      expect(hourToPx(0.5)).toBe(90)
    })
  })

  describe('calcDragResult', () => {
    it('calculates new start time keeping duration unchanged', () => {
      const task = { startHour: 9, durationHours: 1 }
      const result = calcDragResult(task, 180)
      expect(result.newStart).toBe(10)
      expect(result.newEnd).toBe(11)
    })

    it('snaps drag preview to the nearest 5-minute boundary', () => {
      const task = { startHour: 9, durationHours: 1 }
      const result = calcDragResult(task, 46)
      expect(result.newStart).toBe(9.25)
      expect(result.newEnd).toBe(10.25)
    })

    it('clamps start to 0 when dragging above midnight', () => {
      const task = { startHour: 0.5, durationHours: 1 }
      const result = calcDragResult(task, -360)
      expect(result.newStart).toBe(0)
      expect(result.newEnd).toBe(1)
    })

    it('clamps start so task does not exceed 24h', () => {
      const task = { startHour: 22, durationHours: 2 }
      const result = calcDragResult(task, 540)
      expect(result.newStart).toBe(22)
      expect(result.newEnd).toBe(24)
    })
  })

  describe('calcResizeResult', () => {
    it('calculates new end time keeping start unchanged', () => {
      const task = { startHour: 9, durationHours: 1 }
      const result = calcResizeResult(task, 270)
      expect(result.newStart).toBe(9)
      expect(result.newEnd).toBe(10.5)
    })

    it('snaps resize preview to the nearest 5-minute boundary', () => {
      const task = { startHour: 9, durationHours: 1 }
      const result = calcResizeResult(task, 223)
      expect(result.newStart).toBe(9)
      expect(result.newEnd).toBe(10.25)
    })

    it('enforces minimum duration of 5 minutes', () => {
      const task = { startHour: 9, durationHours: 1 }
      const result = calcResizeResult(task, 0)
      expect(result.newStart).toBe(9)
      expect(result.newEnd).toBe(9 + 5 / 60) // 5 minutes minimum = 0.08333h
    })

    it('clamps end time to not exceed 24h', () => {
      const task = { startHour: 23, durationHours: 0.5 }
      const result = calcResizeResult(task, 540)
      expect(result.newStart).toBe(23)
      expect(result.newEnd).toBe(24)
    })
  })
})
