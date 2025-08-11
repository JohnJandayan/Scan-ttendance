import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  createErrorResponse,
  withErrorHandling
} from '@/middleware/error'

// Mock NextResponse
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, options) => ({ data, options }))
  }
}))

describe('Error Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Error Classes', () => {
    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid input', { field: 'email' })
      
      expect(error.message).toBe('Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual({ field: 'email' })
      expect(error.name).toBe('ValidationError')
    })

    it('should create AuthenticationError with correct properties', () => {
      const error = new AuthenticationError()
      
      expect(error.message).toBe('Authentication required')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTHENTICATION_ERROR')
      expect(error.name).toBe('AuthenticationError')
    })

    it('should create AuthorizationError with correct properties', () => {
      const error = new AuthorizationError()
      
      expect(error.message).toBe('Insufficient permissions')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('AUTHORIZATION_ERROR')
      expect(error.name).toBe('AuthorizationError')
    })

    it('should create NotFoundError with correct properties', () => {
      const error = new NotFoundError()
      
      expect(error.message).toBe('Resource not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.name).toBe('NotFoundError')
    })

    it('should create ConflictError with correct properties', () => {
      const error = new ConflictError('Duplicate entry', { field: 'email' })
      
      expect(error.message).toBe('Duplicate entry')
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT_ERROR')
      expect(error.details).toEqual({ field: 'email' })
      expect(error.name).toBe('ConflictError')
    })

    it('should create RateLimitError with correct properties', () => {
      const error = new RateLimitError()
      
      expect(error.message).toBe('Rate limit exceeded')
      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(error.name).toBe('RateLimitError')
    })

    it('should create DatabaseError with correct properties', () => {
      const error = new DatabaseError('Connection failed', { host: 'localhost' })
      
      expect(error.message).toBe('Connection failed')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('DATABASE_ERROR')
      expect(error.details).toEqual({ host: 'localhost' })
      expect(error.name).toBe('DatabaseError')
    })
  })

  describe('createErrorResponse', () => {
    it('should create error response for ValidationError', () => {
      const error = new ValidationError('Invalid email format')
      const response = createErrorResponse(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format'
          },
          timestamp: expect.any(String)
        },
        { status: 400 }
      )
    })

    it('should create error response for AuthenticationError', () => {
      const error = new AuthenticationError()
      const response = createErrorResponse(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Please sign in to continue'
          },
          timestamp: expect.any(String)
        },
        { status: 401 }
      )
    })

    it('should create error response for generic Error', () => {
      const error = new Error('Something went wrong')
      const response = createErrorResponse(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred. Please try again'
          },
          timestamp: expect.any(String)
        },
        { status: 500 }
      )
    })

    it('should include error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new ValidationError('Invalid input', { field: 'email' })
      const response = createErrorResponse(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: expect.objectContaining({
              originalMessage: 'Invalid input',
              stack: expect.any(String),
              field: 'email'
            })
          })
        }),
        { status: 400 }
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should not include error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new ValidationError('Invalid input', { field: 'email' })
      const response = createErrorResponse(error)

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.not.objectContaining({
            details: expect.anything()
          })
        }),
        { status: 400 }
      )

      process.env.NODE_ENV = originalEnv
    })

    it('should log error with request information', () => {
      const mockRequest = {
        method: 'POST',
        url: 'http://localhost:3000/api/test',
        headers: {
          get: vi.fn()
            .mockReturnValueOnce('Mozilla/5.0')
            .mockReturnValueOnce('192.168.1.1')
        }
      } as any

      const error = new ValidationError('Test error')
      const consoleSpy = vi.spyOn(console, 'error')

      createErrorResponse(error, mockRequest)

      expect(consoleSpy).toHaveBeenCalledWith(
        'API Error:',
        expect.objectContaining({
          message: 'Test error',
          method: 'POST',
          url: 'http://localhost:3000/api/test',
          userAgent: 'Mozilla/5.0',
          ip: '192.168.1.1'
        })
      )
    })
  })

  describe('withErrorHandling', () => {
    it('should handle successful request', async () => {
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ success: true, data: 'test' })
      )
      const wrappedHandler = withErrorHandling(mockHandler)
      const mockRequest = {} as NextRequest

      const result = await wrappedHandler(mockRequest)

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, undefined)
      expect(result).toEqual(NextResponse.json({ success: true, data: 'test' }))
    })

    it('should handle thrown error', async () => {
      const error = new ValidationError('Invalid input')
      const mockHandler = vi.fn().mockRejectedValue(error)
      const wrappedHandler = withErrorHandling(mockHandler)
      const mockRequest = {} as NextRequest

      const result = await wrappedHandler(mockRequest)

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            message: 'Invalid input'
          })
        }),
        { status: 400 }
      )
    })

    it('should pass context to handler', async () => {
      const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }))
      const wrappedHandler = withErrorHandling(mockHandler)
      const mockRequest = {} as NextRequest
      const mockContext = { params: { id: '123' } }

      await wrappedHandler(mockRequest, mockContext)

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockContext)
    })
  })

  describe('User-friendly messages', () => {
    const testCases = [
      { error: new ValidationError('Field required'), expected: 'Field required' },
      { error: new AuthenticationError(), expected: 'Please sign in to continue' },
      { error: new AuthorizationError(), expected: 'You do not have permission to perform this action' },
      { error: new NotFoundError(), expected: 'The requested resource was not found' },
      { error: new ConflictError('Duplicate email'), expected: 'Duplicate email' },
      { error: new RateLimitError(), expected: 'Too many requests. Please try again later' },
      { error: new DatabaseError('Connection failed'), expected: 'A database error occurred. Please try again' }
    ]

    testCases.forEach(({ error, expected }) => {
      it(`should return user-friendly message for ${error.constructor.name}`, () => {
        createErrorResponse(error)

        expect(NextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              message: expected
            })
          }),
          expect.any(Object)
        )
      })
    })
  })
})