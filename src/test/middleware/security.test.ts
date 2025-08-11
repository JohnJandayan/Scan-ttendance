import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  addSecurityHeaders,
  handleCors,
  addCorsHeaders,
  withSecurity,
  generateNonce,
  getCSPHeader,
  validateContentType,
  validateRequestSize,
  combineMiddleware,
  createSecurityEventLogger
} from '@/middleware/security'

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

describe('Security Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addSecurityHeaders', () => {
    it('should add all security headers to response', () => {
      const mockResponse = {
        headers: new Map(),
        set: function(key: string, value: string) {
          this.headers.set(key, value)
        }
      } as any

      const result = addSecurityHeaders(mockResponse)

      expect(result.headers.has('X-Content-Type-Options')).toBe(true)
      expect(result.headers.has('X-Frame-Options')).toBe(true)
      expect(result.headers.has('X-XSS-Protection')).toBe(true)
      expect(result.headers.has('Referrer-Policy')).toBe(true)
      expect(result.headers.has('Permissions-Policy')).toBe(true)
      expect(result.headers.has('Strict-Transport-Security')).toBe(true)
      expect(result.headers.has('Content-Security-Policy')).toBe(true)
    })

    it('should set correct header values', () => {
      const mockResponse = {
        headers: new Map(),
        set: function(key: string, value: string) {
          this.headers.set(key, value)
        }
      } as any

      addSecurityHeaders(mockResponse)

      expect(mockResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(mockResponse.headers.get('X-Frame-Options')).toBe('DENY')
      expect(mockResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    })
  })

  describe('handleCors', () => {
    it('should handle OPTIONS preflight request', () => {
      const mockRequest = {
        method: 'OPTIONS',
        headers: {
          get: vi.fn().mockReturnValue('http://localhost:3000')
        }
      } as any

      const result = handleCors(mockRequest)

      expect(result).not.toBeNull()
      expect(result.headers.has('Access-Control-Allow-Origin')).toBe(true)
      expect(result.headers.has('Access-Control-Allow-Methods')).toBe(true)
      expect(result.headers.has('Access-Control-Allow-Headers')).toBe(true)
    })

    it('should reject unauthorized origins', () => {
      const mockRequest = {
        method: 'OPTIONS',
        headers: {
          get: vi.fn().mockReturnValue('http://malicious-site.com')
        }
      } as any

      const result = handleCors(mockRequest)

      expect(result).not.toBeNull()
      expect(result.headers.has('Access-Control-Allow-Origin')).toBe(false)
    })

    it('should return null for non-OPTIONS requests', () => {
      const mockRequest = {
        method: 'GET',
        headers: {
          get: vi.fn().mockReturnValue('http://localhost:3000')
        }
      } as any

      const result = handleCors(mockRequest)
      expect(result).toBeNull()
    })
  })

  describe('addCorsHeaders', () => {
    it('should add CORS headers for allowed origins', () => {
      const mockResponse = {
        headers: new Map(),
        set: function(key: string, value: string) {
          this.headers.set(key, value)
        }
      } as any

      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('http://localhost:3000')
        }
      } as any

      const result = addCorsHeaders(mockResponse, mockRequest)

      expect(result.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
      expect(result.headers.get('Access-Control-Allow-Credentials')).toBe('true')
    })

    it('should not add origin header for unauthorized origins', () => {
      const mockResponse = {
        headers: new Map(),
        set: function(key: string, value: string) {
          this.headers.set(key, value)
        }
      } as any

      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('http://malicious-site.com')
        }
      } as any

      const result = addCorsHeaders(mockResponse, mockRequest)

      expect(result.headers.has('Access-Control-Allow-Origin')).toBe(false)
    })
  })

  describe('withSecurity', () => {
    it('should handle CORS preflight and return early', async () => {
      const mockHandler = vi.fn()
      const secureHandler = withSecurity(mockHandler)

      const mockRequest = {
        method: 'OPTIONS',
        headers: {
          get: vi.fn().mockReturnValue('http://localhost:3000')
        }
      } as any

      const result = await secureHandler(mockRequest)

      expect(mockHandler).not.toHaveBeenCalled()
      expect(result.headers.has('Access-Control-Allow-Origin')).toBe(true)
    })

    it('should execute handler and add security headers', async () => {
      const mockResponse = {
        headers: new Map(),
        set: function(key: string, value: string) {
          this.headers.set(key, value)
        }
      } as any

      const mockHandler = vi.fn().mockResolvedValue(mockResponse)
      const secureHandler = withSecurity(mockHandler)

      const mockRequest = {
        method: 'GET',
        headers: {
          get: vi.fn().mockReturnValue('http://localhost:3000')
        }
      } as any

      const result = await secureHandler(mockRequest)

      expect(mockHandler).toHaveBeenCalledWith(mockRequest)
      expect(result.headers.has('X-Content-Type-Options')).toBe(true)
      expect(result.headers.has('Access-Control-Allow-Origin')).toBe(true)
    })
  })

  describe('generateNonce', () => {
    it('should generate a 32-character hex string', () => {
      const nonce = generateNonce()
      expect(nonce).toMatch(/^[a-f0-9]{32}$/)
    })

    it('should generate different nonces each time', () => {
      const nonce1 = generateNonce()
      const nonce2 = generateNonce()
      expect(nonce1).not.toBe(nonce2)
    })
  })

  describe('getCSPHeader', () => {
    it('should return base CSP without nonce', () => {
      const csp = getCSPHeader()
      expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'")
      expect(csp).toContain("style-src 'self' 'unsafe-inline'")
    })

    it('should replace unsafe-inline with nonce when provided', () => {
      const nonce = 'abc123'
      const csp = getCSPHeader(nonce)
      expect(csp).toContain(`script-src 'self' 'nonce-${nonce}'`)
      expect(csp).toContain(`style-src 'self' 'nonce-${nonce}'`)
      expect(csp).not.toContain("'unsafe-inline'")
    })
  })

  describe('validateContentType', () => {
    it('should allow valid content types', () => {
      const middleware = validateContentType(['application/json'])
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('application/json')
        }
      } as any

      const result = middleware(mockRequest)
      expect(result).toBeNull()
    })

    it('should reject invalid content types', () => {
      const middleware = validateContentType(['application/json'])
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('text/plain')
        }
      } as any

      const result = middleware(mockRequest)
      expect(result).not.toBeNull()
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_CONTENT_TYPE'
          })
        }),
        { status: 415 }
      )
    })

    it('should reject missing content type', () => {
      const middleware = validateContentType(['application/json'])
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any

      const result = middleware(mockRequest)
      expect(result).not.toBeNull()
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'MISSING_CONTENT_TYPE'
          })
        }),
        { status: 400 }
      )
    })
  })

  describe('validateRequestSize', () => {
    it('should allow requests within size limit', () => {
      const middleware = validateRequestSize(1000)
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('500')
        }
      } as any

      const result = middleware(mockRequest)
      expect(result).toBeNull()
    })

    it('should reject requests exceeding size limit', () => {
      const middleware = validateRequestSize(1000)
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('2000')
        }
      } as any

      const result = middleware(mockRequest)
      expect(result).not.toBeNull()
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'REQUEST_TOO_LARGE'
          })
        }),
        { status: 413 }
      )
    })

    it('should allow requests without content-length header', () => {
      const middleware = validateRequestSize(1000)
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any

      const result = middleware(mockRequest)
      expect(result).toBeNull()
    })
  })

  describe('combineMiddleware', () => {
    it('should execute middlewares in order', () => {
      const middleware1 = vi.fn().mockReturnValue(null)
      const middleware2 = vi.fn().mockReturnValue(null)
      const middleware3 = vi.fn().mockReturnValue(null)

      const combined = combineMiddleware(middleware1, middleware2, middleware3)
      const mockRequest = {} as any

      const result = combined(mockRequest)

      expect(middleware1).toHaveBeenCalledWith(mockRequest)
      expect(middleware2).toHaveBeenCalledWith(mockRequest)
      expect(middleware3).toHaveBeenCalledWith(mockRequest)
      expect(result).toBeNull()
    })

    it('should stop at first middleware that returns response', () => {
      const middleware1 = vi.fn().mockReturnValue(null)
      const middleware2 = vi.fn().mockReturnValue({ blocked: true })
      const middleware3 = vi.fn()

      const combined = combineMiddleware(middleware1, middleware2, middleware3)
      const mockRequest = {} as any

      const result = combined(mockRequest)

      expect(middleware1).toHaveBeenCalledWith(mockRequest)
      expect(middleware2).toHaveBeenCalledWith(mockRequest)
      expect(middleware3).not.toHaveBeenCalled()
      expect(result).toEqual({ blocked: true })
    })
  })

  describe('createSecurityEventLogger', () => {
    it('should create logger with request metadata', () => {
      const mockRequest = {
        headers: {
          get: vi.fn()
            .mockReturnValueOnce('192.168.1.1')
            .mockReturnValueOnce('Mozilla/5.0')
        },
        url: 'http://localhost:3000/api/test'
      } as any

      const logger = createSecurityEventLogger(mockRequest)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      logger('suspicious_activity', { reason: 'test' })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Security Event:',
        expect.objectContaining({
          type: 'suspicious_activity',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          endpoint: 'http://localhost:3000/api/test',
          details: { reason: 'test' }
        })
      )

      consoleSpy.mockRestore()
    })

    it('should handle missing headers gracefully', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null)
        },
        url: 'http://localhost:3000/api/test'
      } as any

      const logger = createSecurityEventLogger(mockRequest)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      logger('auth_failure')

      expect(consoleSpy).toHaveBeenCalledWith(
        'Security Event:',
        expect.objectContaining({
          type: 'auth_failure',
          ip: 'unknown',
          userAgent: 'unknown'
        })
      )

      consoleSpy.mockRestore()
    })
  })
})