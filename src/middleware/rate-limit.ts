import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/security'
import { RateLimitError } from './error'

export type RateLimitType = 'auth' | 'scan' | 'api' | 'upload'

export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  let ip = forwarded?.split(',')[0] || realIp || remoteAddr || 'unknown'
  
  // Clean up IP address
  ip = ip.trim()
  
  // For authenticated requests, also include user ID if available
  const authorization = request.headers.get('authorization')
  if (authorization) {
    // This would extract user ID from JWT token
    // For now, just use the IP
    return ip
  }
  
  return ip
}

export function createRateLimitMiddleware(type: RateLimitType) {
  return function rateLimitMiddleware(request: NextRequest): NextResponse | null {
    const identifier = getClientIdentifier(request)
    const limiter = rateLimiters[type]
    
    if (!limiter.isAllowed(identifier)) {
      const resetTime = limiter.getResetTime(identifier)
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: {
              retryAfter,
              resetTime: new Date(resetTime).toISOString()
            }
          },
          timestamp: new Date().toISOString()
        },
        { status: 429 }
      )
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', limiter['maxRequests'].toString())
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', resetTime.toString())
      response.headers.set('Retry-After', retryAfter.toString())
      
      return response
    }
    
    // Request is allowed, continue
    return null
  }
}

export function addRateLimitHeaders(
  response: NextResponse, 
  type: RateLimitType, 
  identifier: string
): NextResponse {
  const limiter = rateLimiters[type]
  const remaining = limiter.getRemainingRequests(identifier)
  const resetTime = limiter.getResetTime(identifier)
  
  response.headers.set('X-RateLimit-Limit', limiter['maxRequests'].toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())
  
  return response
}

// Wrapper function for API routes with rate limiting
export function withRateLimit<T extends any[]>(
  type: RateLimitType,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const rateLimitResponse = createRateLimitMiddleware(type)(request)
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    const response = await handler(request, ...args)
    const identifier = getClientIdentifier(request)
    
    return addRateLimitHeaders(response, type, identifier)
  }
}

// Specific rate limit middlewares
export const authRateLimit = createRateLimitMiddleware('auth')
export const scanRateLimit = createRateLimitMiddleware('scan')
export const apiRateLimit = createRateLimitMiddleware('api')
export const uploadRateLimit = createRateLimitMiddleware('upload')

// Rate limit status checker
export function getRateLimitStatus(type: RateLimitType, identifier: string) {
  const limiter = rateLimiters[type]
  
  return {
    limit: limiter['maxRequests'],
    remaining: limiter.getRemainingRequests(identifier),
    resetTime: limiter.getResetTime(identifier),
    isAllowed: limiter.isAllowed(identifier)
  }
}