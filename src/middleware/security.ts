import { NextRequest, NextResponse } from 'next/server'
import { securityHeaders, corsConfig } from '@/lib/security'

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

export function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const method = request.method
  
  // Handle preflight requests
  if (method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    
    // Check if origin is allowed
    if (origin && corsConfig.origin.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    
    response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
    response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString())
    
    if (corsConfig.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    return addSecurityHeaders(response)
  }
  
  return null
}

export function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')
  
  // Check if origin is allowed
  if (origin && corsConfig.origin.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  if (corsConfig.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
}

export function withSecurity<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Handle CORS preflight
    const corsResponse = handleCors(request)
    if (corsResponse) {
      return corsResponse
    }
    
    // Execute the handler
    const response = await handler(request, ...args)
    
    // Add security headers and CORS headers
    addSecurityHeaders(response)
    addCorsHeaders(response, request)
    
    return response
  }
}

// Content Security Policy nonce generator
export function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// CSP header with nonce
export function getCSPHeader(nonce?: string): string {
  const baseCSP = securityHeaders['Content-Security-Policy']
  
  if (nonce) {
    return baseCSP
      .replace("script-src 'self' 'unsafe-inline' 'unsafe-eval'", `script-src 'self' 'nonce-${nonce}'`)
      .replace("style-src 'self' 'unsafe-inline'", `style-src 'self' 'nonce-${nonce}'`)
  }
  
  return baseCSP
}

// Input validation middleware
export function validateContentType(allowedTypes: string[]) {
  return function contentTypeMiddleware(request: NextRequest): NextResponse | null {
    const contentType = request.headers.get('content-type')
    
    if (!contentType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_CONTENT_TYPE',
            message: 'Content-Type header is required'
          }
        },
        { status: 400 }
      )
    }
    
    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    )
    
    if (!isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CONTENT_TYPE',
            message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
          }
        },
        { status: 415 }
      )
    }
    
    return null
  }
}

// Request size validation
export function validateRequestSize(maxSizeBytes: number) {
  return function requestSizeMiddleware(request: NextRequest): NextResponse | null {
    const contentLength = request.headers.get('content-length')
    
    if (contentLength) {
      const size = parseInt(contentLength, 10)
      
      if (size > maxSizeBytes) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'REQUEST_TOO_LARGE',
              message: `Request size exceeds maximum allowed size of ${maxSizeBytes} bytes`
            }
          },
          { status: 413 }
        )
      }
    }
    
    return null
  }
}

// Combine multiple middleware functions
export function combineMiddleware<T extends any[]>(
  ...middlewares: Array<(request: NextRequest, ...args: T) => NextResponse | null>
) {
  return function combinedMiddleware(request: NextRequest, ...args: T): NextResponse | null {
    for (const middleware of middlewares) {
      const response = middleware(request, ...args)
      if (response) {
        return response
      }
    }
    return null
  }
}

// Security audit logging
export interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'invalid_input' | 'suspicious_activity'
  ip: string
  userAgent?: string
  endpoint: string
  details?: any
  timestamp: string
}

export function logSecurityEvent(event: SecurityEvent): void {
  // In production, this would send to a security monitoring service
  console.warn('Security Event:', event)
  
  // For now, just log to console
  // In production, you would send this to services like:
  // - Sentry for error tracking
  // - DataDog for monitoring
  // - AWS CloudWatch for logging
  // - Custom security dashboard
}

export function createSecurityEventLogger(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown'
  const userAgent = request.headers.get('user-agent') || undefined
  const endpoint = request.url
  
  return function logEvent(
    type: SecurityEvent['type'], 
    details?: any
  ): void {
    logSecurityEvent({
      type,
      ip,
      userAgent,
      endpoint,
      details,
      timestamp: new Date().toISOString()
    })
  }
}