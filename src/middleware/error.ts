import { NextRequest, NextResponse } from 'next/server'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export class ValidationError extends Error {
  statusCode = 400
  code = 'VALIDATION_ERROR'
  
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  statusCode = 401
  code = 'AUTHENTICATION_ERROR'
  
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  statusCode = 403
  code = 'AUTHORIZATION_ERROR'
  
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends Error {
  statusCode = 404
  code = 'NOT_FOUND'
  
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  statusCode = 409
  code = 'CONFLICT_ERROR'
  
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends Error {
  statusCode = 429
  code = 'RATE_LIMIT_EXCEEDED'
  
  constructor(message: string = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class DatabaseError extends Error {
  statusCode = 500
  code = 'DATABASE_ERROR'
  
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export function createErrorResponse(error: ApiError | Error, request?: NextRequest) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Log error details
  logError(error, request)
  
  // Determine status code and error code
  const statusCode = (error as ApiError).statusCode || 500
  const errorCode = (error as ApiError).code || 'INTERNAL_SERVER_ERROR'
  
  // Create user-friendly error message
  const userMessage = getUserFriendlyMessage(error, statusCode)
  
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: userMessage,
      ...(isDevelopment && {
        details: {
          originalMessage: error.message,
          stack: error.stack,
          ...(error as ApiError).details
        }
      })
    },
    timestamp: new Date().toISOString()
  }

  return NextResponse.json(errorResponse, { status: statusCode })
}

function getUserFriendlyMessage(error: Error, statusCode: number): string {
  // Return user-friendly messages based on error type
  switch (error.constructor.name) {
    case 'ValidationError':
      return error.message
    case 'AuthenticationError':
      return 'Please sign in to continue'
    case 'AuthorizationError':
      return 'You do not have permission to perform this action'
    case 'NotFoundError':
      return 'The requested resource was not found'
    case 'ConflictError':
      return error.message
    case 'RateLimitError':
      return 'Too many requests. Please try again later'
    case 'DatabaseError':
      return 'A database error occurred. Please try again'
    default:
      switch (statusCode) {
        case 400:
          return 'Invalid request. Please check your input'
        case 401:
          return 'Authentication required'
        case 403:
          return 'Access denied'
        case 404:
          return 'Resource not found'
        case 409:
          return 'Conflict with existing data'
        case 429:
          return 'Too many requests'
        case 500:
        default:
          return 'An unexpected error occurred. Please try again'
      }
  }
}

function logError(error: Error, request?: NextRequest) {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
    ...(request && {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    }),
    ...(error as ApiError).details && { details: (error as ApiError).details }
  }

  // Log to console (in production, this would go to a logging service)
  console.error('API Error:', errorLog)

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to error monitoring service (e.g., Sentry, LogRocket, etc.)
    // This would be implemented based on your chosen monitoring solution
  }
}

// Wrapper function for API route handlers
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      return createErrorResponse(error as ApiError, request)
    }
  }
}

// Async error handler for use in try-catch blocks
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(errorMessage || 'An unexpected error occurred')
  }
}