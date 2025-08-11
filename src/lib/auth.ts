import jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'

export interface TokenPayload {
  id: string
  email: string
  organizationId: string
  role?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface SessionData {
  userId: string
  organizationId: string
  email: string
  role?: string
  issuedAt: number
  expiresAt: number
}

// Password hashing and verification
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

// JWT token generation and validation
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '15m',
    issuer: 'scan-ttendance',
    audience: 'scan-ttendance-users'
  })
}

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { 
    expiresIn: '7d',
    issuer: 'scan-ttendance',
    audience: 'scan-ttendance-users'
  })
}

export const generateTokenPair = (payload: TokenPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  }
}

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'scan-ttendance',
      audience: 'scan-ttendance-users'
    }) as TokenPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('ACCESS_TOKEN_EXPIRED')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_ACCESS_TOKEN')
    }
    throw new Error('TOKEN_VERIFICATION_FAILED')
  }
}

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'scan-ttendance',
      audience: 'scan-ttendance-users'
    }) as TokenPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('REFRESH_TOKEN_EXPIRED')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_REFRESH_TOKEN')
    }
    throw new Error('TOKEN_VERIFICATION_FAILED')
  }
}

// Legacy function for backward compatibility
export const generateToken = (payload: Record<string, unknown>): string => {
  return generateAccessToken(payload as unknown as TokenPayload)
}

export const verifyTokenLegacy = (token: string): Record<string, unknown> => {
  return verifyAccessToken(token) as unknown as Record<string, unknown>
}

// Session management utilities
export const createSessionData = (payload: TokenPayload): SessionData => {
  const now = Date.now()
  return {
    userId: payload.id,
    organizationId: payload.organizationId,
    email: payload.email,
    role: payload.role,
    issuedAt: now,
    expiresAt: now + (15 * 60 * 1000) // 15 minutes
  }
}

export const isSessionValid = (session: SessionData): boolean => {
  return Date.now() < session.expiresAt
}

export const refreshSession = (session: SessionData): SessionData => {
  const now = Date.now()
  return {
    ...session,
    issuedAt: now,
    expiresAt: now + (15 * 60 * 1000) // 15 minutes
  }
}

// Token extraction utilities
export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}

export const extractRefreshTokenFromCookie = (cookieHeader: string | null): string | null => {
  if (!cookieHeader) return null
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)
  
  return cookies.refreshToken || null
}

// API route token verification
export interface VerifyTokenResult {
  success: boolean
  data?: {
    userId: string
    organizationId: string
    email: string
    role?: string
  }
  error?: string
}

export const verifyTokenFromRequest = async (request: Request): Promise<VerifyTokenResult> => {
  try {
    const authHeader = request.headers.get('authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return {
        success: false,
        error: 'No authentication token provided'
      }
    }

    const decoded = verifyAccessToken(token)
    
    return {
      success: true,
      data: {
        userId: decoded.id,
        organizationId: decoded.organizationId,
        email: decoded.email,
        role: decoded.role
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token verification failed'
    }
  }
}

// Alias for backward compatibility
export const verifyToken = verifyTokenFromRequest
