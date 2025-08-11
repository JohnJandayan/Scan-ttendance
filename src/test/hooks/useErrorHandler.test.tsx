import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useErrorHandler, useFormErrorHandler } from '@/hooks/useErrorHandler'
import { ClientError } from '@/lib/error-handling'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

describe('useErrorHandler', () => {
  const mockPush = vi.fn()
  const mockBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: mockBack
    } as any)
  })

  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler())

    expect(result.current.error).toBeNull()
    expect(result.current.errorMessage).toBeNull()
    expect(result.current.errorCode).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.retryCount).toBe(0)
    expect(result.current.canRetry).toBe(false)
  })

  it('should handle successful operation', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const mockOperation = vi.fn().mockResolvedValue('success')

    let operationResult: any
    await act(async () => {
      operationResult = await result.current.executeWithErrorHandling(mockOperation)
    })

    expect(operationResult).toBe('success')
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(mockOperation).toHaveBeenCalledTimes(1)
  })

  it('should handle operation error', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const error = new Error('Operation failed')
    const mockOperation = vi.fn().mockRejectedValue(error)

    let operationResult: any
    await act(async () => {
      operationResult = await result.current.executeWithErrorHandling(mockOperation)
    })

    expect(operationResult).toBeNull()
    expect(result.current.error).toBe(error)
    expect(result.current.errorMessage).toBe('Operation failed')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.retryCount).toBe(1)
  })

  it('should redirect on authentication error', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const error = new ClientError('Auth required', 'AUTHENTICATION_ERROR', 401)
    const mockOperation = vi.fn().mockRejectedValue(error)

    await act(async () => {
      await result.current.executeWithErrorHandling(mockOperation)
    })

    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })

  it('should go back on authorization error', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const error = new ClientError('Forbidden', 'AUTHORIZATION_ERROR', 403)
    const mockOperation = vi.fn().mockRejectedValue(error)

    await act(async () => {
      await result.current.executeWithErrorHandling(mockOperation)
    })

    expect(mockBack).toHaveBeenCalledTimes(1)
  })

  it('should call custom error handler', async () => {
    const onError = vi.fn()
    const { result } = renderHook(() => useErrorHandler({ onError }))
    const error = new Error('Test error')
    const mockOperation = vi.fn().mockRejectedValue(error)

    await act(async () => {
      await result.current.executeWithErrorHandling(mockOperation)
    })

    expect(onError).toHaveBeenCalledWith(error)
  })

  it('should retry retryable errors', async () => {
    vi.useFakeTimers()
    
    const { result } = renderHook(() => useErrorHandler({ maxRetries: 2 }))
    const error = new ClientError('Server error', 'SERVER_ERROR', 500)
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue('success')

    let operationResult: any
    const operationPromise = act(async () => {
      operationResult = await result.current.executeWithErrorHandling(mockOperation)
    })

    // Fast-forward through retry delays
    vi.advanceTimersByTime(5000)
    
    await operationPromise

    expect(operationResult).toBe('success')
    expect(mockOperation).toHaveBeenCalledTimes(2)
    
    vi.useRealTimers()
  })

  it('should not retry when skipRetry is true', async () => {
    const { result } = renderHook(() => useErrorHandler())
    const error = new ClientError('Server error', 'SERVER_ERROR', 500)
    const mockOperation = vi.fn().mockRejectedValue(error)

    await act(async () => {
      await result.current.executeWithErrorHandling(mockOperation, { skipRetry: true })
    })

    expect(mockOperation).toHaveBeenCalledTimes(1)
  })

  it('should clear error', () => {
    const { result } = renderHook(() => useErrorHandler())
    const error = new Error('Test error')

    act(() => {
      result.current.handleError(error)
    })

    expect(result.current.error).toBe(error)

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.retryCount).toBe(0)
  })

  it('should determine if can retry', () => {
    const { result } = renderHook(() => useErrorHandler({ maxRetries: 3 }))
    
    // No error - cannot retry
    expect(result.current.canRetry).toBe(false)

    // Retryable error with retries left
    act(() => {
      const error = new ClientError('Server error', 'SERVER_ERROR', 500)
      result.current.handleError(error)
    })
    expect(result.current.canRetry).toBe(true)

    // Non-retryable error
    act(() => {
      result.current.clearError()
      const error = new ClientError('Bad request', 'BAD_REQUEST', 400)
      result.current.handleError(error)
    })
    expect(result.current.canRetry).toBe(false)
  })
})

describe('useFormErrorHandler', () => {
  it('should initialize with no errors', () => {
    const { result } = renderHook(() => useFormErrorHandler())

    expect(result.current.fieldErrors).toEqual({})
    expect(result.current.generalError).toBeNull()
    expect(result.current.hasErrors).toBe(false)
  })

  it('should handle validation errors with field details', () => {
    const { result } = renderHook(() => useFormErrorHandler())
    const error = new ClientError('Validation failed', 'VALIDATION_ERROR', 400, {
      fields: {
        email: 'Email is required',
        password: 'Password is too short'
      }
    })

    act(() => {
      result.current.handleFormError(error)
    })

    expect(result.current.fieldErrors).toEqual({
      email: 'Email is required',
      password: 'Password is too short'
    })
    expect(result.current.generalError).toBeNull()
    expect(result.current.hasErrors).toBe(true)
  })

  it('should handle general form errors', () => {
    const { result } = renderHook(() => useFormErrorHandler())
    const error = new Error('General form error')

    act(() => {
      result.current.handleFormError(error)
    })

    expect(result.current.fieldErrors).toEqual({})
    expect(result.current.generalError).toBe('General form error')
    expect(result.current.hasErrors).toBe(true)
  })

  it('should clear field error', () => {
    const { result } = renderHook(() => useFormErrorHandler())
    const error = new ClientError('Validation failed', 'VALIDATION_ERROR', 400, {
      fields: {
        email: 'Email is required',
        password: 'Password is too short'
      }
    })

    act(() => {
      result.current.handleFormError(error)
    })

    act(() => {
      result.current.clearFieldError('email')
    })

    expect(result.current.fieldErrors).toEqual({
      password: 'Password is too short'
    })
    expect(result.current.hasErrors).toBe(true)
  })

  it('should clear all errors', () => {
    const { result } = renderHook(() => useFormErrorHandler())
    const error = new ClientError('Validation failed', 'VALIDATION_ERROR', 400, {
      fields: {
        email: 'Email is required'
      }
    })

    act(() => {
      result.current.handleFormError(error)
    })

    act(() => {
      result.current.clearAllErrors()
    })

    expect(result.current.fieldErrors).toEqual({})
    expect(result.current.generalError).toBeNull()
    expect(result.current.hasErrors).toBe(false)
  })
})