import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuditLogger, auditLogger, getRequestMetadata } from '@/lib/audit-log'
import { supabase } from '@/lib/database'

// Mock Supabase
vi.mock('@/lib/database', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  gte: vi.fn(() => ({
                    lte: vi.fn(() => ({ data: [], error: null }))
                  }))
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  }
}))

describe('Audit Logging', () => {
  let mockSupabaseFrom: any
  let mockInsert: any
  let mockSelect: any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    mockInsert = vi.fn(() => ({ error: null }))
    mockSelect = vi.fn(() => ({
      order: vi.fn(() => ({
        range: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => ({ data: [], error: null }))
                }))
              }))
            }))
          }))
        }))
      }))
    }))
    
    mockSupabaseFrom = vi.fn(() => ({
      insert: mockInsert,
      select: mockSelect
    }))
    
    vi.mocked(supabase.from).mockImplementation(mockSupabaseFrom)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('AuditLogger', () => {
    it('should be a singleton', () => {
      const logger1 = AuditLogger.getInstance()
      const logger2 = AuditLogger.getInstance()
      expect(logger1).toBe(logger2)
    })

    it('should queue log entries', async () => {
      const logger = AuditLogger.getInstance()
      
      await logger.log({
        userId: 'user123',
        organizationId: 'org123',
        action: 'auth.login',
        resource: 'authentication',
        success: true
      })

      expect(logger['logQueue']).toHaveLength(1)
      expect(logger['logQueue'][0]).toMatchObject({
        userId: 'user123',
        organizationId: 'org123',
        action: 'auth.login',
        resource: 'authentication',
        success: true,
        timestamp: expect.any(String)
      })
    })

    it('should process queue when it reaches 10 entries', async () => {
      const logger = AuditLogger.getInstance()
      
      // Add 10 entries to trigger immediate processing
      for (let i = 0; i < 10; i++) {
        await logger.log({
          action: 'auth.login',
          resource: 'authentication',
          success: true
        })
      }

      expect(mockSupabaseFrom).toHaveBeenCalledWith('audit_logs')
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'auth.login',
            resource: 'authentication',
            success: true
          })
        ])
      )
    })

    it('should process queue on timer', async () => {
      const logger = AuditLogger.getInstance()
      
      await logger.log({
        action: 'auth.login',
        resource: 'authentication',
        success: true
      })

      // Fast forward 5 seconds to trigger timer
      vi.advanceTimersByTime(5000)

      expect(mockSupabaseFrom).toHaveBeenCalledWith('audit_logs')
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const logger = AuditLogger.getInstance()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock database error
      mockInsert.mockReturnValue({ error: new Error('Database error') })
      
      await logger.log({
        action: 'auth.login',
        resource: 'authentication',
        success: true
      })

      // Trigger processing
      vi.advanceTimersByTime(5000)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to insert audit logs:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should re-queue failed entries', async () => {
      const logger = AuditLogger.getInstance()
      
      // Mock database error
      mockInsert.mockReturnValue({ error: new Error('Database error') })
      
      await logger.log({
        action: 'auth.login',
        resource: 'authentication',
        success: true
      })

      const initialQueueLength = logger['logQueue'].length

      // Trigger processing
      vi.advanceTimersByTime(5000)

      // Entry should be back in queue
      expect(logger['logQueue'].length).toBeGreaterThan(0)
    })
  })

  describe('Convenience methods', () => {
    it('should log authentication events', async () => {
      const logger = AuditLogger.getInstance()
      
      await logger.logAuth(
        'login',
        'user123',
        'org123',
        { method: 'email' },
        '192.168.1.1',
        'Mozilla/5.0',
        true
      )

      expect(logger['logQueue']).toHaveLength(1)
      expect(logger['logQueue'][0]).toMatchObject({
        userId: 'user123',
        organizationId: 'org123',
        action: 'auth.login',
        resource: 'authentication',
        details: { method: 'email' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        success: true
      })
    })

    it('should log organization events', async () => {
      const logger = AuditLogger.getInstance()
      
      await logger.logOrganization(
        'create',
        'org123',
        'user123',
        { name: 'Test Org' },
        '192.168.1.1',
        'Mozilla/5.0',
        true
      )

      expect(logger['logQueue'][0]).toMatchObject({
        userId: 'user123',
        organizationId: 'org123',
        action: 'org.create',
        resource: 'organization',
        resourceId: 'org123',
        details: { name: 'Test Org' }
      })
    })

    it('should log member events', async () => {
      const logger = AuditLogger.getInstance()
      
      await logger.logMember(
        'create',
        'member123',
        'org123',
        'user123',
        { role: 'manager' }
      )

      expect(logger['logQueue'][0]).toMatchObject({
        action: 'member.create',
        resource: 'member',
        resourceId: 'member123',
        details: { role: 'manager' }
      })
    })

    it('should log event events', async () => {
      const logger = AuditLogger.getInstance()
      
      await logger.logEvent(
        'create',
        'event123',
        'org123',
        'user123',
        { name: 'Test Event' }
      )

      expect(logger['logQueue'][0]).toMatchObject({
        action: 'event.create',
        resource: 'event',
        resourceId: 'event123',
        details: { name: 'Test Event' }
      })
    })

    it('should log scan events', async () => {
      const logger = AuditLogger.getInstance()
      
      await logger.logScan(
        'verify',
        'event123',
        'org123',
        'user123',
        { participantId: 'ID123' }
      )

      expect(logger['logQueue'][0]).toMatchObject({
        action: 'scan.verify',
        resource: 'scan',
        resourceId: 'event123',
        details: { participantId: 'ID123' }
      })
    })

    it('should log security events', async () => {
      const logger = AuditLogger.getInstance()
      
      await logger.logSecurity(
        'rate_limit',
        'api',
        'endpoint123',
        'user123',
        'org123',
        { limit: 60 },
        '192.168.1.1',
        'Mozilla/5.0',
        'Rate limit exceeded'
      )

      expect(logger['logQueue'][0]).toMatchObject({
        action: 'security.rate_limit',
        resource: 'api',
        resourceId: 'endpoint123',
        success: false,
        errorMessage: 'Rate limit exceeded'
      })
    })
  })

  describe('Query methods', () => {
    it('should get audit logs with filters', async () => {
      const logger = AuditLogger.getInstance()
      const mockData = [
        {
          id: '1',
          action: 'auth.login',
          resource: 'authentication',
          timestamp: new Date().toISOString()
        }
      ]

      // Mock the query chain
      const mockLte = vi.fn(() => ({ data: mockData, error: null }))
      const mockGte = vi.fn(() => ({ lte: mockLte }))
      const mockEq4 = vi.fn(() => ({ gte: mockGte }))
      const mockEq3 = vi.fn(() => ({ eq: mockEq4 }))
      const mockEq2 = vi.fn(() => ({ eq: mockEq3 }))
      const mockEq1 = vi.fn(() => ({ eq: mockEq2 }))
      const mockRange = vi.fn(() => ({ eq: mockEq1 }))
      const mockOrder = vi.fn(() => ({ range: mockRange }))
      const mockSelect = vi.fn(() => ({ order: mockOrder }))
      
      mockSupabaseFrom.mockReturnValue({ select: mockSelect })

      const result = await logger.getAuditLogs(
        'org123',
        'user123',
        'auth.login',
        'authentication',
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        50,
        0
      )

      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockOrder).toHaveBeenCalledWith('timestamp', { ascending: false })
      expect(mockRange).toHaveBeenCalledWith(0, 49)
      expect(mockEq1).toHaveBeenCalledWith('organizationId', 'org123')
      expect(mockEq2).toHaveBeenCalledWith('userId', 'user123')
      expect(mockEq3).toHaveBeenCalledWith('action', 'auth.login')
      expect(mockEq4).toHaveBeenCalledWith('resource', 'authentication')
      expect(result).toEqual(mockData)
    })

    it('should get audit statistics', async () => {
      const logger = AuditLogger.getInstance()
      const mockData = [
        { action: 'auth.login', resource: 'authentication', success: true },
        { action: 'auth.login', resource: 'authentication', success: false },
        { action: 'event.create', resource: 'event', success: true }
      ]

      // Mock the query chain for stats
      const mockLte = vi.fn(() => ({ data: mockData, error: null }))
      const mockGte = vi.fn(() => ({ lte: mockLte }))
      const mockEq = vi.fn(() => ({ gte: mockGte }))
      const mockSelect = vi.fn(() => ({ eq: mockEq }))
      
      mockSupabaseFrom.mockReturnValue({ select: mockSelect })

      const result = await logger.getAuditStats(
        'org123',
        new Date('2024-01-01'),
        new Date('2024-12-31')
      )

      expect(result).toEqual({
        totalEvents: 3,
        successfulEvents: 2,
        failedEvents: 1,
        actionBreakdown: {
          'auth.login': 2,
          'event.create': 1
        },
        resourceBreakdown: {
          'authentication': 2,
          'event': 1
        }
      })
    })

    it('should handle query errors gracefully', async () => {
      const logger = AuditLogger.getInstance()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock query error
      const mockSelect = vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => ({ error: new Error('Query error') }))
        }))
      }))
      
      mockSupabaseFrom.mockReturnValue({ select: mockSelect })

      const result = await logger.getAuditLogs()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching audit logs:',
        expect.any(Error)
      )
      expect(result).toEqual([])

      consoleSpy.mockRestore()
    })
  })

  describe('getRequestMetadata', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn()
            .mockReturnValueOnce('192.168.1.1, 10.0.0.1')
            .mockReturnValueOnce(null)
            .mockReturnValueOnce('Mozilla/5.0')
        }
      } as any

      const result = getRequestMetadata(mockRequest)

      expect(result).toEqual({
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      })
    })

    it('should extract IP from x-real-ip header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn()
            .mockReturnValueOnce(null)
            .mockReturnValueOnce('192.168.1.2')
            .mockReturnValueOnce('Mozilla/5.0')
        }
      } as any

      const result = getRequestMetadata(mockRequest)

      expect(result).toEqual({
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0'
      })
    })

    it('should handle missing headers', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any

      const result = getRequestMetadata(mockRequest)

      expect(result).toEqual({
        ipAddress: 'unknown',
        userAgent: 'unknown'
      })
    })
  })

  describe('Exported singleton', () => {
    it('should export the singleton instance', () => {
      expect(auditLogger).toBeInstanceOf(AuditLogger)
      expect(auditLogger).toBe(AuditLogger.getInstance())
    })
  })
})