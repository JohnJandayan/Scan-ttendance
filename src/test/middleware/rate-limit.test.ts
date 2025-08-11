import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  getClientIdentifier,
  createRateLimitMiddleware,
  addRateLimitHeaders,
  withRateLimit
} from '@/middleware/rate-limit'
import { rateLimiters } from '@/lib/security'

// Mock NextResponse
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, options) => ({
      data,
      options,
      headers: new Map(),
      set: function(key: string, value: string) {
        this.headers.set(key, value)
      }
    }))
  }
}))

describe('Rate Limit Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear rate limiter state
    Object.values(rateLimiters).forEach(limiter => {
      limiter['limits'].clear()
    })
  })

  describe('getClientIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn()
            .mockReturnValueOnce('192.168.1.1, 10.0.0.1')
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(null)
        }
      } as any

      const result = getClientIdentifier(mockRequest)
      expect(result).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn()
            .mockReturnValueOnce(null)
            .mockReturnValueOnce('192.168.1.2')
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(null)
        }
      } as any

      const result = getClientIdentifier(mockRequest)
      expect(result).toBe('192.168.1.2')
    })

    it('should extract IP from remote-addr header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn()
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(null)
            .mockReturnValueOnce('192.168.1.3')
            .mockReturnValueOnce(null)
        }
      } as any

      const result = getClientIdentifier(mockRequest)
      expect(result).toBe('192.168.1.3')
    })

    it('should return unknown when no IP headers present', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any

      const result = getClientIdentifier(mockRequest)
      expect(result).toBe('unknown')
    })

    it('should trim whitespace from IP address', () => {
      const mockRequest = {
        headers: {
          get: vi.fn()
            .mockReturnValueOnce('  192.168.1.1  ')
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(null)
        }
      } as any

      const result = getClientIdentifier(mockRequest)
      expect(result).toBe('192.168.1.1')
    })
  })

  describe('createRateLimitMiddleware', () => {
    it('should allow requests within rate limit', () => {
      const middleware = createRateLimitMiddleware('api')
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('192.168.1.1')
        }
      } as any

      const result = middleware(mockRequest)
      expect(result).toBeNull()
    })

    it('should block requests exceeding rate limit', () => {
      const middleware = createRateLimitMiddleware('auth')
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('192.168.1.1')
        }
      } as any

      // Use up all allowed requests
      for (let i = 0; i < 5; i++) {
        middleware(mockRequest)
      }

      // Next request should be blocked
      const result = middleware(mockRequest)
      expect(result).not.toBeNull()
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'RATE_LIMIT_EXCEEDED'
          })
        }),
        { status: 429 }
      )
    })

    it('should include rate limit headers in blocked response', () => {
      const middleware = createRateLimitMiddleware('auth')
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('192.168.1.1')
        }
      } as any

      // Use up all allowed requests
      for (let i = 0; i < 5; i++) {
        middleware(mockRequest)
      }

      // Next request should be blocked with headers
      const result = middleware(mockRequest)
      expect(result.headers.has('X-RateLimit-Limit')).toBe(true)
      expect(result.headers.has('X-RateLimit-Remaining')).toBe(true)
      expect(result.headers.has('X-RateLimit-Reset')).toBe(true)
      expect(result.headers.has('Retry-After')).toBe(true)
    })
  })

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers to response', () => {
      const mockResponse = {
        headers: new Map(),
        set: function(key: string, value: string) {
          this.headers.set(key, value)
        }
      } as any

      const result = addRateLimitHeaders(mockResponse, 'api', '192.168.1.1')

      expect(result.headers.has('X-RateLimit-Limit')).toBe(true)
      expect(result.headers.has('X-RateLimit-Remaining')).toBe(true)
      expect(result.headers.has('X-RateLimit-Reset')).toBe(true)
    })
  })

  describe('withRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      )
      const rateLimitedHandler = withRateLimit('api', mockHandler)
      
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('192.168.1.1')
        }
      } as any

      const result = await rateLimitedHandler(mockRequest)
      
      expect(mockHandler).toHaveBeenCalledWith(mockRequest)
      expect(result.headers.has('X-RateLimit-Limit')).toBe(true)
    })

    it('should block requests exceeding rate limit', async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      )
      const rateLimitedHandler = withRateLimit('auth', mockHandler)
      
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('192.168.1.1')
        }
      } as any

      // Use up all allowed requests
      for (let i = 0; i < 5; i++) {
        await rateLimitedHandler(mockRequest)
      }

      // Next request should be blocked
      const result = await rateLimitedHandler(mockRequest)
      
      expect(NextResponse.json).toHaveBeenLastCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'RATE_LIMIT_EXCEEDED'
          })
        }),
        { status: 429 }
      )
    })

    it('should pass additional arguments to handler', async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      )
      const rateLimitedHandler = withRateLimit('api', mockHandler)
      
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('192.168.1.1')
        }
      } as any
      const mockContext = { params: { id: '123' } }

      await rateLimitedHandler(mockRequest, mockContext)
      
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockContext)
    })
  })

  describe('Rate limit types', () => {
    it('should have different limits for different types', () => {
      const authLimiter = rateLimiters.auth
      const scanLimiter = rateLimiters.scan
      const apiLimiter = rateLimiters.api
      const uploadLimiter = rateLimiters.upload

      expect(authLimiter['maxRequests']).toBe(5)
      expect(scanLimiter['maxRequests']).toBe(100)
      expect(apiLimiter['maxRequests']).toBe(60)
      expect(uploadLimiter['maxRequests']).toBe(10)
    })

    it('should have different windows for different types', () => {
      const authLimiter = rateLimiters.auth
      const scanLimiter = rateLimiters.scan
      const apiLimiter = rateLimiters.api
      const uploadLimiter = rateLimiters.upload

      expect(authLimiter['windowMs']).toBe(15 * 60 * 1000) // 15 minutes
      expect(scanLimiter['windowMs']).toBe(60 * 1000) // 1 minute
      expect(apiLimiter['windowMs']).toBe(60 * 1000) // 1 minute
      expect(uploadLimiter['windowMs']).toBe(60 * 1000) // 1 minute
    })
  })
})