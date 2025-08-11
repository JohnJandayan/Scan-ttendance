export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  timestamp?: string
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

export class ClientError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ClientError'
  }
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json()
  
  if (!data.success) {
    throw new ClientError(
      data.error.message,
      data.error.code,
      response.status,
      data.error.details
    )
  }
  
  return data.data
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ClientError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred'
}

export function getErrorCode(error: unknown): string {
  if (error instanceof ClientError) {
    return error.code
  }
  
  return 'UNKNOWN_ERROR'
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  
  if (error instanceof ClientError && error.statusCode >= 500) {
    return true
  }
  
  return false
}

export function shouldRetry(error: unknown): boolean {
  if (isNetworkError(error)) {
    return true
  }
  
  if (error instanceof ClientError) {
    // Retry on server errors and rate limits
    return error.statusCode >= 500 || error.statusCode === 429
  }
  
  return false
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  throw lastError
}

// Error recovery strategies
export const errorRecoveryStrategies = {
  authentication: {
    message: 'Your session has expired. Please sign in again.',
    action: 'redirect',
    target: '/auth/signin'
  },
  
  authorization: {
    message: 'You do not have permission to perform this action.',
    action: 'goBack',
    target: null
  },
  
  notFound: {
    message: 'The requested resource was not found.',
    action: 'redirect',
    target: '/dashboard'
  },
  
  network: {
    message: 'Network error. Please check your connection and try again.',
    action: 'retry',
    target: null
  },
  
  rateLimit: {
    message: 'Too many requests. Please wait a moment and try again.',
    action: 'wait',
    target: null
  },
  
  validation: {
    message: 'Please check your input and try again.',
    action: 'focus',
    target: null
  },
  
  default: {
    message: 'An unexpected error occurred. Please try again.',
    action: 'retry',
    target: null
  }
}

export function getRecoveryStrategy(error: unknown) {
  if (error instanceof ClientError) {
    switch (error.code) {
      case 'AUTHENTICATION_ERROR':
        return errorRecoveryStrategies.authentication
      case 'AUTHORIZATION_ERROR':
        return errorRecoveryStrategies.authorization
      case 'NOT_FOUND':
        return errorRecoveryStrategies.notFound
      case 'RATE_LIMIT_EXCEEDED':
        return errorRecoveryStrategies.rateLimit
      case 'VALIDATION_ERROR':
        return errorRecoveryStrategies.validation
      default:
        if (isNetworkError(error)) {
          return errorRecoveryStrategies.network
        }
        return errorRecoveryStrategies.default
    }
  }
  
  if (isNetworkError(error)) {
    return errorRecoveryStrategies.network
  }
  
  return errorRecoveryStrategies.default
}