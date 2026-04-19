/**
 * Database Service Tests (src/services/__tests__/database.spec.js)
 *
 * Tests that db.rpc() properly throws on RPC errors,
 * verifying the throw contract needed for safeDb migration.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRpc = vi.fn()

vi.mock('@/config/supabase', () => ({
  default: {
    rpc: mockRpc,
    createBase: vi.fn(() => ({
      query: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }))
  }
}))

vi.mock('@/composables/useGlobalLoading', () => ({
  trackGlobalLoading: (fn) => fn()
}))

describe('database service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rpc', () => {
    it('should throw when RPC call fails', async () => {
      const error = new Error('RPC error: function not found')
      mockRpc.mockRejectedValue(error)

      const { db } = await import('../database')

      await expect(db.rpc('test_function', {})).rejects.toThrow('RPC error: function not found')
    })

    it('should return result on successful RPC call', async () => {
      const mockResult = { data: [{ id: 1 }] }
      mockRpc.mockResolvedValue(mockResult)

      const { db } = await import('../database')
      const result = await db.rpc('test_function', {})

      expect(result).toEqual(mockResult)
    })

    it('should pass parameters to RPC call', async () => {
      mockRpc.mockResolvedValue({ data: [] })

      const { db } = await import('../database')
      await db.rpc('batch_upsert_daily_plans', { plans: [{ id: '1' }] })

      expect(mockRpc).toHaveBeenCalledWith('batch_upsert_daily_plans', { plans: [{ id: '1' }] })
    })
  })

  describe('throw contract for error propagation', () => {
    it('should propagate RPC errors to callers', async () => {
      // This test ensures db.rpc() throws so that callers (like useDirectionBatch)
      // can properly handle failures and don't silently continue with stale data
      const error = new Error('Network error')
      mockRpc.mockRejectedValue(error)

      const { db } = await import('../database')

      let thrown = false
      try {
        await db.rpc('some_rpc', {})
      } catch (e) {
        thrown = true
        expect(e.message).toBe('Network error')
      }
      expect(thrown).toBe(true)
    })
  })
})
