import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ClientError,
  handleApiResponse,
  getErrorMessage,
  getErrorCode,
  isNetworkError,
  shouldRetry,
  retryOperation,
  getRecoveryStrategy
} from '@/lib/error-handling'

describe('Error Handling', () => {
  describe('ClientError', () => {
    it('should create a ClientError with correct properties', () => {
      const error = new ClientError('Test error', 'TEST_ERROR', 400, { field: 'test' })
      
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.details).toEqual({ field: 'test' })
      expect(error.name).toBe('ClientError')
    })
  })

  describe('handleApiResponse', () => {
    it('should return data for successful response', async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          success: true,
          data: { id: 1, name: 'test' }
        })
      } as any

      const result = await handleApiResponse(mockResponse)
      expect(result).toEqual({ id: 1, name: 'test' })
    })

    it('should throw ClientError for error response', async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: 'TEST_ERROR',
            message: 'Test error message',
            details: { field: 'test' }
          }
        }),
        status: 400
      } as any

      await expect(handleApiResponse(mockResponse)).rejects.toThrow(ClientError)
      
      try {
        await handleApiResponse(mockResponse)
      } catch (error) {
        expect(error).toBeInstanceOf(ClientError)
        expect((error as ClientError).code).toBe('TEST_ERROR')
        expect((error as ClientError).statusCode).toBe(400)
      }
    })
  })

  describe('getErrorMessage', () => {
    it('should return message from ClientError', () => {
      const error = new ClientError('Client error', 'TEST_ERROR', 400)
      expect(getErrorMessage(error)).toBe('Client error')
    })

    it('should return message from regular Error', () => {
      const error = new Error('Regular error')
      expect(getErrorMessage(error)).toBe('Regular error')
    })

    it('should return string error as is', () => {
      expect(getErrorMessage('String error')).toBe('String error')
    })

    it('should return default message for unknown error', () => {
      expect(getErrorMessage({})).toBe('An unexpected error occurred')
    })
  })

  describe('getErrorCode', () => {
    it('should return code from ClientError', () => {
      const error = new ClientError('Test', 'TEST_ERROR', 400)
      expect(getErrorCode(error)).toBe('TEST_ERROR')
    })

    it('should return UNKNOWN_ERROR for other errors', () => {
      const error = new Error('Test')
      expect(getErrorCode(error)).toBe('UNKNOWN_ERROR')
    })
  })

  describe('isNetworkError', () => {
    it('should identify TypeError with fetch as network error', () => {
      const error = new TypeError('fetch failed')
      expect(isNetworkError(error)).toBe(true)
    })

    it('should identify ClientError with 5xx status as network error', () => {
      const error = new ClientError('Server error', 'SERVER_ERROR', 500)
      expect(isNetworkError(error)).toBe(true)
    })

    it('should not identify 4xx errors as network errors', () => {
      const error = new ClientError('Client error', 'CLIENT_ERROR', 400)
      expect(isNetworkError(error)).toBe(false)
    })
  })

  describe('shouldRetry', () => {
    it('should retry network errors', () => {
      const error = new TypeError('fetch failed')
      expect(shouldRetry(error)).toBe(true)
    })

    it('should retry server errors', () => {
      const error = new ClientError('Server error', 'SERVER_ERROR', 500)
      expect(shouldRetry(error)).toBe(true)
    })

    it('should retry rate limit errors', () => {
      const error = new ClientError('Rate limited', 'RATE_LIMIT', 429)
      expect(shouldRetry(error)).toBe(true)
    })

    it('should not retry client errors', () => {
      const error = new ClientError('Bad request', 'BAD_REQUEST', 400)
      expect(shouldRetry(error)).toBe(false)
    })
  })

  describe('retryOperation', () => {

    it('should succeed on first try', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      
      const result = await retryOperation(operation, 3, 100)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new ClientError('Server error', 'SERVER_ERROR', 500))
        .mockResolvedValue('success')
      
      const result = await retryOperation(operation, 3, 10) // Use shorter delay
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn()
        .mockRejectedValue(new ClientError('Bad request', 'BAD_REQUEST', 400))
      
      await expect(retryOperation(operation, 3, 100)).rejects.toThrow('Bad request')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should give up after max retries', async () => {
      const error = new ClientError('Server error', 'SERVER_ERROR', 500)
      const operation = vi.fn().mockRejectedValue(error)
      
      await expect(retryOperation(operation, 2, 10)).rejects.toThrow('Server error')
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('getRecoveryStrategy', () => {
    it('should return authentication strategy for auth errors', () => {
      const error = new ClientError('Auth required', 'AUTHENTICATION_ERROR', 401)
      const strategy = getRecoveryStrategy(error)
      
      expect(strategy.action).toBe('redirect')
      expect(strategy.target).toBe('/auth/signin')
    })

    it('should return authorization strategy for permission errors', () => {
      const error = new ClientError('Forbidden', 'AUTHORIZATION_ERROR', 403)
      const strategy = getRecoveryStrategy(error)
      
      expect(strategy.action).toBe('goBack')
    })

    it('should return rate limit strategy for rate limit errors', () => {
      const error = new ClientError('Rate limited', 'RATE_LIMIT_EXCEEDED', 429)
      const strategy = getRecoveryStrategy(error)
      
      expect(strategy.action).toBe('wait')
    })

    it('should return network strategy for network errors', () => {
      const error = new TypeError('fetch failed')
      const strategy = getRecoveryStrategy(error)
      
      expect(strategy.action).toBe('retry')
    })

    it('should return default strategy for unknown errors', () => {
      const error = new Error('Unknown error')
      const strategy = getRecoveryStrategy(error)
      
      expect(strategy.action).toBe('retry')
    })
  })
})