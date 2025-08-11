import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withOptionalAuth, requireRole, allowTokenRefresh, AuthenticatedRequest } from '@/middleware/auth'
import { generateAccessToken, generateRefreshToken, TokenPayload } from '@/lib/auth'

// Mock the auth functions
vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual('@/lib/auth')
  return {
    ...actual,
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
    generateAccessToken: vi.fn(),
    extractTokenFromHeader: vi.fn(),
    extractRefreshTokenFromCookie: vi.fn(),
    createSessionData: vi.fn()
  }
})

const mockPayload: TokenPayload = {
  id: 'user-123',
  email: 'test@example.com',
  organizationId: 'org-456',
  role: 'admin'
}

describe('Authentication Middleware', () => {
  let mockHandler: vi.MockedFunction<(request: AuthenticatedRequest) => Promise<NextResponse>>

  beforeEach(() => {
    vi.clearAllMocks()
    mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }))
  })

  describe('withAuth', () => {
    it('should authenticate valid token and call handler', async () => {
      const { verifyAccessToken, extractTokenFromHeader, createSessionData } = await import('@/lib/auth')
      
      vi.mocked(extractTokenFromHeader).mockReturnValue('valid-token')
      vi.mocked(verifyAccessToken).mockReturnValue(mockPayload)
      vi.mocked(createSessionData).mockReturnValue({
        userId: mockPayload.id,
        organizationId: mockPayload.organizationId,
        email: mockPayload.email,
        role: mockPayload.role,
        issuedAt: Date.now(),
        expiresAt: Date.now() + (15 * 60 * 1000)
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer valid-token' }
      })

      const middleware = withAuth(mockHandler)
      const response = await middleware(request)

      expect(extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token')
      expect(verifyAccessToken).toHaveBeenCalledWith('valid-token')
      expect(mockHandler).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('should return 401 when no token provided', async () => {
      const { extractTokenFromHeader } = await import('@/lib/auth')
      
      vi.mocked(extractTokenFromHeader).mockReturnValue(null)

      const request = new NextRequest('http://localhost:3000/api/test')

      const middleware = withAuth(mockHandler)
      const response = await middleware(request)

      expect(response.status).toBe(401)
      expect(mockHandler).not.toHaveBeenCalled()

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('NO_TOKEN')
    })

    it('should return 401 when token is invalid', async () => {
      const { verifyAccessToken, extractTokenFromHeader } = await import('@/lib/auth')
      
      vi.mocked(extractTokenFromHeader).mockReturnValue('invalid-token')
      vi.mocked(verifyAccessToken).mockImplementation(() => {
        throw new Error('INVALID_ACCESS_TOKEN')
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer invalid-token' }
      })

      const middleware = withAuth(mockHandler)
      const response = await middleware(request)

      expect(response.status).toBe(401)
      expect(mockHandler).not.toHaveBeenCalled()

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INVALID_TOKEN')
    })

    it('should handle token refresh when access token expired', async () => {
      const { 
        verifyAccessToken, 
        verifyRefreshToken, 
        generateAccessToken,
        extractTokenFromHeader,
        extractRefreshTokenFromCookie,
        createSessionData
      } = await import('@/lib/auth')
      
      vi.mocked(extractTokenFromHeader).mockReturnValue('expired-token')
      vi.mocked(extractRefreshTokenFromCookie).mockReturnValue('valid-refresh-token')
      vi.mocked(verifyAccessToken).mockImplementation(() => {
        throw new Error('ACCESS_TOKEN_EXPIRED')
      })
      vi.mocked(verifyRefreshToken).mockReturnValue(mockPayload)
      vi.mocked(generateAccessToken).mockReturnValue('new-access-token')
      vi.mocked(createSessionData).mockReturnValue({
        userId: mockPayload.id,
        organizationId: mockPayload.organizationId,
        email: mockPayload.email,
        role: mockPayload.role,
        issuedAt: Date.now(),
        expiresAt: Date.now() + (15 * 60 * 1000)
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 
          authorization: 'Bearer expired-token',
          cookie: 'refreshToken=valid-refresh-token'
        }
      })

      const middleware = withAuth(mockHandler, allowTokenRefresh())
      const response = await middleware(request)

      expect(verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token')
      expect(generateAccessToken).toHaveBeenCalledWith(mockPayload)
      expect(mockHandler).toHaveBeenCalled()
      expect(response.headers.get('X-New-Access-Token')).toBe('new-access-token')
    })

    it('should enforce role-based access control', async () => {
      const { verifyAccessToken, extractTokenFromHeader, createSessionData } = await import('@/lib/auth')
      
      const userPayload = { ...mockPayload, role: 'user' }
      
      vi.mocked(extractTokenFromHeader).mockReturnValue('valid-token')
      vi.mocked(verifyAccessToken).mockReturnValue(userPayload)
      vi.mocked(createSessionData).mockReturnValue({
        userId: userPayload.id,
        organizationId: userPayload.organizationId,
        email: userPayload.email,
        role: userPayload.role,
        issuedAt: Date.now(),
        expiresAt: Date.now() + (15 * 60 * 1000)
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer valid-token' }
      })

      const middleware = withAuth(mockHandler, requireRole(['admin']))
      const response = await middleware(request)

      expect(response.status).toBe(403)
      expect(mockHandler).not.toHaveBeenCalled()

      const body = await response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('INSUFFICIENT_PERMISSIONS')
    })

    it('should allow access with correct role', async () => {
      const { verifyAccessToken, extractTokenFromHeader, createSessionData } = await import('@/lib/auth')
      
      vi.mocked(extractTokenFromHeader).mockReturnValue('valid-token')
      vi.mocked(verifyAccessToken).mockReturnValue(mockPayload)
      vi.mocked(createSessionData).mockReturnValue({
        userId: mockPayload.id,
        organizationId: mockPayload.organizationId,
        email: mockPayload.email,
        role: mockPayload.role,
        issuedAt: Date.now(),
        expiresAt: Date.now() + (15 * 60 * 1000)
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer valid-token' }
      })

      const middleware = withAuth(mockHandler, requireRole(['admin', 'manager']))
      const response = await middleware(request)

      expect(response.status).toBe(200)
      expect(mockHandler).toHaveBeenCalled()
    })
  })

  describe('withOptionalAuth', () => {
    it('should call handler without authentication when no token provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/test')

      const middleware = withOptionalAuth(mockHandler)
      const response = await middleware(request)

      expect(mockHandler).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('should authenticate when valid token provided', async () => {
      const { verifyAccessToken, extractTokenFromHeader, createSessionData } = await import('@/lib/auth')
      
      vi.mocked(extractTokenFromHeader).mockReturnValue('valid-token')
      vi.mocked(verifyAccessToken).mockReturnValue(mockPayload)
      vi.mocked(createSessionData).mockReturnValue({
        userId: mockPayload.id,
        organizationId: mockPayload.organizationId,
        email: mockPayload.email,
        role: mockPayload.role,
        issuedAt: Date.now(),
        expiresAt: Date.now() + (15 * 60 * 1000)
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer valid-token' }
      })

      const middleware = withOptionalAuth(mockHandler)
      const response = await middleware(request)

      expect(verifyAccessToken).toHaveBeenCalledWith('valid-token')
      expect(mockHandler).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('should continue without authentication when invalid token provided', async () => {
      const { verifyAccessToken, extractTokenFromHeader } = await import('@/lib/auth')
      
      vi.mocked(extractTokenFromHeader).mockReturnValue('invalid-token')
      vi.mocked(verifyAccessToken).mockImplementation(() => {
        throw new Error('INVALID_ACCESS_TOKEN')
      })

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { authorization: 'Bearer invalid-token' }
      })

      const middleware = withOptionalAuth(mockHandler)
      const response = await middleware(request)

      expect(mockHandler).toHaveBeenCalled()
      expect(response.status).toBe(200)
    })
  })

  describe('Helper Functions', () => {
    it('should create requireRole options correctly', () => {
      const options = requireRole(['admin', 'manager'])
      expect(options.requireRole).toEqual(['admin', 'manager'])
    })

    it('should create allowTokenRefresh options correctly', () => {
      const options = allowTokenRefresh()
      expect(options.allowRefresh).toBe(true)
    })
  })
})