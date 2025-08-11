import { describe, it, expect, beforeEach, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  createSessionData,
  isSessionValid,
  refreshSession,
  extractTokenFromHeader,
  extractRefreshTokenFromCookie,
  TokenPayload
} from '@/lib/auth'

// Set test environment variables
process.env.JWT_SECRET = 'test-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'

describe('Authentication Services', () => {
  const mockPayload: TokenPayload = {
    id: 'user-123',
    email: 'test@example.com',
    organizationId: 'org-456',
    role: 'admin'
  }

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50)
    })

    it('should verify password correctly', async () => {
      const password = 'testpassword123'
      const hash = await hashPassword(password)
      
      const isValid = await comparePassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testpassword123'
      const wrongPassword = 'wrongpassword'
      const hash = await hashPassword(password)
      
      const isValid = await comparePassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Generation', () => {
    it('should generate access token with correct payload', () => {
      const token = generateAccessToken(mockPayload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      
      const decoded = jwt.decode(token) as any
      expect(decoded.id).toBe(mockPayload.id)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.organizationId).toBe(mockPayload.organizationId)
      expect(decoded.role).toBe(mockPayload.role)
      expect(decoded.iss).toBe('scan-ttendance')
      expect(decoded.aud).toBe('scan-ttendance-users')
    })

    it('should generate refresh token with correct payload', () => {
      const token = generateRefreshToken(mockPayload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      
      const decoded = jwt.decode(token) as any
      expect(decoded.id).toBe(mockPayload.id)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.organizationId).toBe(mockPayload.organizationId)
      expect(decoded.role).toBe(mockPayload.role)
      expect(decoded.iss).toBe('scan-ttendance')
      expect(decoded.aud).toBe('scan-ttendance-users')
    })

    it('should generate token pair with both access and refresh tokens', () => {
      const tokenPair = generateTokenPair(mockPayload)
      
      expect(tokenPair.accessToken).toBeDefined()
      expect(tokenPair.refreshToken).toBeDefined()
      expect(typeof tokenPair.accessToken).toBe('string')
      expect(typeof tokenPair.refreshToken).toBe('string')
      expect(tokenPair.accessToken).not.toBe(tokenPair.refreshToken)
    })
  })

  describe('JWT Token Verification', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(mockPayload)
      const decoded = verifyAccessToken(token)
      
      expect(decoded.id).toBe(mockPayload.id)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.organizationId).toBe(mockPayload.organizationId)
      expect(decoded.role).toBe(mockPayload.role)
    })

    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(mockPayload)
      const decoded = verifyRefreshToken(token)
      
      expect(decoded.id).toBe(mockPayload.id)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.organizationId).toBe(mockPayload.organizationId)
      expect(decoded.role).toBe(mockPayload.role)
    })

    it('should throw error for invalid access token', () => {
      const invalidToken = 'invalid.token.here'
      
      expect(() => verifyAccessToken(invalidToken)).toThrow('INVALID_ACCESS_TOKEN')
    })

    it('should throw error for invalid refresh token', () => {
      const invalidToken = 'invalid.token.here'
      
      expect(() => verifyRefreshToken(invalidToken)).toThrow('INVALID_REFRESH_TOKEN')
    })

    it('should handle token verification errors correctly', () => {
      // Test that the error handling mechanism works
      // The specific error type (expired vs invalid) is handled by the JWT library
      const invalidToken = 'invalid.token.here'
      
      expect(() => verifyAccessToken(invalidToken)).toThrow()
      expect(() => verifyRefreshToken(invalidToken)).toThrow()
    })
  })

  describe('Session Management', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
    })

    it('should create session data correctly', () => {
      const session = createSessionData(mockPayload)
      
      expect(session.userId).toBe(mockPayload.id)
      expect(session.organizationId).toBe(mockPayload.organizationId)
      expect(session.email).toBe(mockPayload.email)
      expect(session.role).toBe(mockPayload.role)
      expect(session.issuedAt).toBe(Date.now())
      expect(session.expiresAt).toBe(Date.now() + (15 * 60 * 1000))
    })

    it('should validate active session', () => {
      const session = createSessionData(mockPayload)
      
      expect(isSessionValid(session)).toBe(true)
    })

    it('should invalidate expired session', () => {
      const session = createSessionData(mockPayload)
      
      // Move time forward by 20 minutes
      vi.advanceTimersByTime(20 * 60 * 1000)
      
      expect(isSessionValid(session)).toBe(false)
    })

    it('should refresh session correctly', () => {
      const originalSession = createSessionData(mockPayload)
      
      // Move time forward by 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      
      const refreshedSession = refreshSession(originalSession)
      
      expect(refreshedSession.userId).toBe(originalSession.userId)
      expect(refreshedSession.organizationId).toBe(originalSession.organizationId)
      expect(refreshedSession.email).toBe(originalSession.email)
      expect(refreshedSession.role).toBe(originalSession.role)
      expect(refreshedSession.issuedAt).toBe(Date.now())
      expect(refreshedSession.expiresAt).toBe(Date.now() + (15 * 60 * 1000))
    })
  })

  describe('Token Extraction Utilities', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      const authHeader = `Bearer ${token}`
      
      const extracted = extractTokenFromHeader(authHeader)
      expect(extracted).toBe(token)
    })

    it('should return null for invalid auth header format', () => {
      expect(extractTokenFromHeader('InvalidFormat token')).toBeNull()
      expect(extractTokenFromHeader('Bearer')).toBeNull()
      expect(extractTokenFromHeader('Bearer token extra')).toBeNull()
    })

    it('should return null for null auth header', () => {
      expect(extractTokenFromHeader(null)).toBeNull()
    })

    it('should extract refresh token from cookie', () => {
      const refreshToken = 'refresh.token.here'
      const cookieHeader = `sessionId=abc123; refreshToken=${refreshToken}; path=/`
      
      const extracted = extractRefreshTokenFromCookie(cookieHeader)
      expect(extracted).toBe(refreshToken)
    })

    it('should return null when refresh token not in cookies', () => {
      const cookieHeader = 'sessionId=abc123; otherCookie=value'
      
      const extracted = extractRefreshTokenFromCookie(cookieHeader)
      expect(extracted).toBeNull()
    })

    it('should return null for null cookie header', () => {
      expect(extractRefreshTokenFromCookie(null)).toBeNull()
    })
  })
})