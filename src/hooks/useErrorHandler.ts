import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getErrorMessage, 
  getErrorCode, 
  getRecoveryStrategy, 
  ClientError,
  retryOperation 
} from '@/lib/error-handling'

interface ErrorState {
  error: Error | null
  isLoading: boolean
  retryCount: number
}

interface UseErrorHandlerOptions {
  maxRetries?: number
  onError?: (error: Error) => void
  showToast?: boolean
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { maxRetries = 3, onError, showToast = true } = options
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    retryCount: 0
  })
  const router = useRouter()

  const handleError = useCallback((error: unknown) => {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    
    setErrorState(prev => ({
      ...prev,
      error: errorObj
    }))

    // Call custom error handler if provided
    if (onError) {
      onError(errorObj)
    }

    // Show toast notification if enabled
    if (showToast) {
      // This would integrate with your toast notification system
      console.error('Error:', getErrorMessage(error))
    }

    // Handle specific error types
    const recoveryStrategy = getRecoveryStrategy(error)
    
    switch (recoveryStrategy.action) {
      case 'redirect':
        if (recoveryStrategy.target) {
          router.push(recoveryStrategy.target)
        }
        break
      case 'goBack':
        router.back()
        break
      // Other recovery actions handled by UI components
    }
  }, [onError, showToast, router])

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: { skipRetry?: boolean }
  ): Promise<T | null> => {
    setErrorState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      let result: T
      
      if (options?.skipRetry) {
        result = await operation()
      } else {
        result = await retryOperation(operation, maxRetries)
      }
      
      setErrorState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: null,
        retryCount: 0 
      }))
      
      return result
    } catch (error) {
      setErrorState(prev => ({ 
        ...prev, 
        isLoading: false,
        retryCount: prev.retryCount + 1
      }))
      
      handleError(error)
      return null
    }
  }, [handleError, maxRetries])

  const retry = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    return executeWithErrorHandling(operation)
  }, [executeWithErrorHandling])

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isLoading: false,
      retryCount: 0
    })
  }, [])

  const canRetry = useCallback(() => {
    if (!errorState.error) return false
    
    const recoveryStrategy = getRecoveryStrategy(errorState.error)
    return recoveryStrategy.action === 'retry' && errorState.retryCount < maxRetries
  }, [errorState.error, errorState.retryCount, maxRetries])

  return {
    error: errorState.error,
    errorMessage: errorState.error ? getErrorMessage(errorState.error) : null,
    errorCode: errorState.error ? getErrorCode(errorState.error) : null,
    isLoading: errorState.isLoading,
    retryCount: errorState.retryCount,
    canRetry: canRetry(),
    executeWithErrorHandling,
    retry,
    clearError,
    handleError
  }
}

// Specialized hook for form error handling
export function useFormErrorHandler() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const handleFormError = useCallback((error: unknown) => {
    if (error instanceof ClientError && error.code === 'VALIDATION_ERROR' && error.details) {
      // Handle field-specific validation errors
      if (typeof error.details === 'object' && error.details.fields) {
        setFieldErrors(error.details.fields)
        setGeneralError(null)
        return
      }
    }

    // Handle general form errors
    setFieldErrors({})
    setGeneralError(getErrorMessage(error))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setFieldErrors({})
    setGeneralError(null)
  }, [])

  return {
    fieldErrors,
    generalError,
    hasErrors: Object.keys(fieldErrors).length > 0 || !!generalError,
    handleFormError,
    clearFieldError,
    clearAllErrors
  }
}