import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Input sanitization utilities
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  // Limit length to prevent DoS
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000)
  }

  return sanitized
}

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email).toLowerCase()

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format')
  }

  return sanitized
}

export function sanitizeOrganizationName(name: string): string {
  const sanitized = sanitizeString(name)

  // Remove special characters that could cause issues in schema names
  const cleaned = sanitized.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim()

  if (cleaned.length < 2) {
    throw new Error('Organization name must be at least 2 characters')
  }

  if (cleaned.length > 100) {
    throw new Error('Organization name must be less than 100 characters')
  }

  return cleaned
}

export function sanitizeEventName(name: string): string {
  const sanitized = sanitizeString(name)

  // Remove special characters that could cause issues in table names
  const cleaned = sanitized.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim()

  if (cleaned.length < 1) {
    throw new Error('Event name is required')
  }

  if (cleaned.length > 100) {
    throw new Error('Event name must be less than 100 characters')
  }

  return cleaned
}

export function sanitizeParticipantId(id: string): string {
  const sanitized = sanitizeString(id)

  // Allow alphanumeric characters, hyphens, and underscores
  const cleaned = sanitized.replace(/[^a-zA-Z0-9\-_]/g, '')

  if (cleaned.length < 1) {
    throw new Error('Participant ID is required')
  }

  if (cleaned.length > 50) {
    throw new Error('Participant ID must be less than 50 characters')
  }

  return cleaned
}

// Validation schemas using Zod
export const authSchemas = {
  register: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .transform(sanitizeString),
    email: z.string().email('Invalid email format').transform(sanitizeEmail),
    organizationName: z
      .string()
      .min(2, 'Organization name must be at least 2 characters')
      .max(100, 'Organization name must be less than 100 characters')
      .transform(sanitizeOrganizationName),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      ),
  }),

  login: z.object({
    email: z.string().email('Invalid email format').transform(sanitizeEmail),
    password: z
      .string()
      .min(1, 'Password is required')
      .max(128, 'Password must be less than 128 characters'),
  }),
}

export const eventSchemas = {
  create: z.object({
    name: z
      .string()
      .min(1, 'Event name is required')
      .max(100, 'Event name must be less than 100 characters')
      .transform(sanitizeEventName),
    description: z
      .string()
      .max(500, 'Description must be less than 500 characters')
      .optional()
      .transform(val => (val ? sanitizeString(val) : undefined)),
  }),

  addAttendees: z.object({
    attendees: z
      .array(
        z.object({
          name: z
            .string()
            .min(1, 'Name is required')
            .max(100, 'Name must be less than 100 characters')
            .transform(sanitizeString),
          participantId: z
            .string()
            .min(1, 'Participant ID is required')
            .max(50, 'Participant ID must be less than 50 characters')
            .transform(sanitizeParticipantId),
        })
      )
      .max(1000, 'Cannot add more than 1000 attendees at once'),
  }),
}

export const memberSchemas = {
  create: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .transform(sanitizeString),
    email: z.string().email('Invalid email format').transform(sanitizeEmail),
    role: z.enum(['admin', 'manager', 'viewer']).refine(
      (val) => ['admin', 'manager', 'viewer'].includes(val),
      { message: 'Role must be admin, manager, or viewer' }
    ),
  }),

  update: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .transform(sanitizeString)
      .optional(),
    role: z
      .enum(['admin', 'manager', 'viewer'])
      .refine(
        (val) => ['admin', 'manager', 'viewer'].includes(val),
        { message: 'Role must be admin, manager, or viewer' }
      )
      .optional(),
  }),
}

export const scanSchemas = {
  verify: z.object({
    participantId: z
      .string()
      .min(1, 'Participant ID is required')
      .max(50, 'Participant ID must be less than 50 characters')
      .transform(sanitizeParticipantId),
    eventId: z.string().uuid('Invalid event ID format'),
  }),
}

// SQL injection prevention utilities
export function escapeIdentifier(identifier: string): string {
  // Remove any characters that aren't alphanumeric, underscore, or hyphen
  const cleaned = identifier.replace(/[^a-zA-Z0-9_-]/g, '')

  // Ensure it doesn't start with a number
  if (/^\d/.test(cleaned)) {
    throw new Error('Identifier cannot start with a number')
  }

  // Ensure it's not empty
  if (cleaned.length === 0) {
    throw new Error('Identifier cannot be empty')
  }

  // Ensure it's not too long
  if (cleaned.length > 63) {
    throw new Error('Identifier is too long')
  }

  return cleaned
}

export function validateTableName(tableName: string): string {
  const escaped = escapeIdentifier(tableName)

  // Additional validation for table names
  const reservedWords = [
    'user',
    'users',
    'admin',
    'root',
    'system',
    'public',
    'private',
    'select',
    'insert',
    'update',
    'delete',
    'drop',
    'create',
    'alter',
    'table',
    'database',
    'schema',
    'index',
    'view',
    'trigger',
    'function',
  ]

  if (reservedWords.includes(escaped.toLowerCase())) {
    throw new Error('Table name cannot be a reserved word')
  }

  return escaped
}

export function validateSchemaName(schemaName: string): string {
  const escaped = escapeIdentifier(schemaName)

  // Schema names must start with 'org_'
  if (!escaped.startsWith('org_')) {
    throw new Error('Schema name must start with org_')
  }

  return escaped
}

// Rate limiting utilities
interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>()

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const entry = this.limits.get(identifier)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return true
    }

    if (entry.count >= this.maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - entry.count)
  }

  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return Date.now() + this.windowMs
    }
    return entry.resetTime
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }
}

// Rate limiters for different endpoints
export const rateLimiters = {
  auth: new RateLimiter(5, 15 * 60 * 1000), // 5 requests per 15 minutes
  scan: new RateLimiter(100, 60 * 1000), // 100 scans per minute
  api: new RateLimiter(60, 60 * 1000), // 60 API requests per minute
  upload: new RateLimiter(10, 60 * 1000), // 10 uploads per minute
}

// Clean up rate limiters every 5 minutes
if (typeof window === 'undefined') {
  setInterval(
    () => {
      Object.values(rateLimiters).forEach(limiter => limiter.cleanup())
    },
    5 * 60 * 1000
  )
}

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=self, microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline and unsafe-eval
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' wss: https:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
}

// CORS configuration
export const corsConfig = {
  origin:
    process.env.NODE_ENV === 'production'
      ? [process.env.NEXT_PUBLIC_APP_URL || 'https://scan-ttendance.vercel.app']
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
}
