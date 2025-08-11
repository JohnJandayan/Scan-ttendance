import { NextRequest, NextResponse } from 'next/server'
import { 
  verifyAccessToken, 
  verifyRefreshToken, 
  generateAccessToken,
  extractTokenFromHeader,
  extractRefreshTokenFromCookie,
  TokenPayload,
  SessionData,
  createSessionData,
  isSessionValid,
  refreshSession
} from '@/lib/auth'

export interface AuthenticatedRequest extends NextRequest {
  user: TokenPayload
  session: SessionData
}

type AuthHandler = (request: AuthenticatedRequest) => Promise<NextResponse>

export interface AuthMiddlewareOptions {
  requireRole?: string[]
  allowRefresh?: boolean
}

export function withAuth(handler: AuthHandler, options: AuthMiddlewareOptions = {}) {
  return async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get('authorization')
      const token = extractTokenFromHeader(authHeader)

      if (!token) {
        return NextResponse.json(
          { 
            success: false,
            error: {
              code: 'NO_TOKEN',
              message: 'No authentication token provided'
            }
          },
          { status: 401 }
        )
      }

      let decoded: TokenPayload
      let shouldRefreshToken = false

      try {
        decoded = verifyAccessToken(token)
      } catch (error) {
        if (error instanceof Error && error.message === 'ACCESS_TOKEN_EXPIRED' && options.allowRefresh) {
          // Try to refresh using refresh token
          const cookieHeader = request.headers.get('cookie')
          const refreshToken = extractRefreshTokenFromCookie(cookieHeader)

          if (!refreshToken) {
            return NextResponse.json(
              { 
                success: false,
                error: {
                  code: 'TOKEN_EXPIRED',
                  message: 'Access token expired and no refresh token provided'
                }
              },
              { status: 401 }
            )
          }

          try {
            decoded = verifyRefreshToken(refreshToken)
            shouldRefreshToken = true
          } catch (refreshError) {
            return NextResponse.json(
              { 
                success: false,
                error: {
                  code: 'REFRESH_TOKEN_INVALID',
                  message: 'Both access and refresh tokens are invalid'
                }
              },
              { status: 401 }
            )
          }
        } else {
          return NextResponse.json(
            { 
              success: false,
              error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid authentication token'
              }
            },
            { status: 401 }
          )
        }
      }

      // Check role-based access if required
      if (options.requireRole && options.requireRole.length > 0) {
        if (!decoded.role || !options.requireRole.includes(decoded.role)) {
          return NextResponse.json(
            { 
              success: false,
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this resource'
              }
            },
            { status: 403 }
          )
        }
      }

      // Create session data
      const session = createSessionData(decoded)

      // Add user info and session to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = decoded
      authenticatedRequest.session = session

      const response = await handler(authenticatedRequest)

      // If token needs refresh, add new access token to response headers
      if (shouldRefreshToken) {
        const newAccessToken = generateAccessToken(decoded)
        response.headers.set('X-New-Access-Token', newAccessToken)
      }

      return response
    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Authentication failed'
          }
        },
        { status: 500 }
      )
    }
  }
}

export function withOptionalAuth(handler: AuthHandler) {
  return async (request: NextRequest) => {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      // No token provided, continue without authentication
      const authenticatedRequest = request as AuthenticatedRequest
      return handler(authenticatedRequest)
    }

    try {
      const decoded = verifyAccessToken(token)
      const session = createSessionData(decoded)

      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = decoded
      authenticatedRequest.session = session

      return handler(authenticatedRequest)
    } catch {
      // Invalid token, continue without authentication
      const authenticatedRequest = request as AuthenticatedRequest
      return handler(authenticatedRequest)
    }
  }
}

export function requireRole(roles: string[]) {
  return { requireRole: roles }
}

export function allowTokenRefresh() {
  return { allowRefresh: true }
}
