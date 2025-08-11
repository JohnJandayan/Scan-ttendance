import { z } from 'zod'

// Base interfaces
export interface Organization {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: Date
  updatedAt: Date
  schema: string
}

export interface Member {
  id: string
  orgId: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
  createdAt: Date
}

export interface Event {
  id: string
  name: string
  creatorId: string
  createdAt: Date
  endedAt?: Date
  isActive: boolean
  attendanceTableName: string
  verificationTableName: string
}

export interface AttendanceRecord {
  id: string
  name: string
  participantId: string
  createdAt: Date
}

export interface VerificationRecord {
  id: string
  name: string
  participantId: string
  status: 'verified' | 'duplicate' | 'invalid'
  verifiedAt: Date
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
}

// Zod validation schemas
export const OrganizationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Organization name is required').max(255, 'Organization name too long'),
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  passwordHash: z.string().min(1, 'Password hash is required'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  schema: z.string().min(1, 'Schema name is required').optional()
})

export const OrganizationCreateSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Organization name too long'),
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password too long')
})

export const MemberSchema = z.object({
  id: z.string().uuid().optional(),
  orgId: z.string().uuid('Invalid organization ID'),
  name: z.string().min(1, 'Member name is required').max(255, 'Member name too long'),
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  role: z.enum(['admin', 'manager', 'viewer']),
  createdAt: z.date().optional()
})

export const MemberCreateSchema = z.object({
  name: z.string().min(1, 'Member name is required').max(255, 'Member name too long'),
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  role: z.enum(['admin', 'manager', 'viewer']).default('viewer')
})

export const EventSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Event name is required').max(255, 'Event name too long'),
  creatorId: z.string().uuid('Invalid creator ID'),
  createdAt: z.date().optional(),
  endedAt: z.date().optional().nullable(),
  isActive: z.boolean().default(true),
  attendanceTableName: z.string().min(1, 'Attendance table name is required'),
  verificationTableName: z.string().min(1, 'Verification table name is required')
})

export const EventCreateSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255, 'Event name too long'),
  creatorId: z.string().uuid('Invalid creator ID')
})

export const AttendanceRecordSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Participant name is required').max(255, 'Participant name too long'),
  participantId: z.string().min(1, 'Participant ID is required').max(255, 'Participant ID too long'),
  createdAt: z.date().optional()
})

export const AttendanceRecordCreateSchema = z.object({
  name: z.string().min(1, 'Participant name is required').max(255, 'Participant name too long'),
  participantId: z.string().min(1, 'Participant ID is required').max(255, 'Participant ID too long')
})

export const VerificationRecordSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Participant name is required').max(255, 'Participant name too long'),
  participantId: z.string().min(1, 'Participant ID is required').max(255, 'Participant ID too long'),
  status: z.enum(['verified', 'duplicate', 'invalid']),
  verifiedAt: z.date().optional()
})

export const VerificationRecordCreateSchema = z.object({
  name: z.string().min(1, 'Participant name is required').max(255, 'Participant name too long'),
  participantId: z.string().min(1, 'Participant ID is required').max(255, 'Participant ID too long'),
  status: z.enum(['verified', 'duplicate', 'invalid']).default('verified')
})

// CSV import schema
export const CSVAttendeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  participantId: z.string().min(1, 'ID is required').max(255, 'ID too long')
})

export const CSVImportSchema = z.array(CSVAttendeeSchema).min(1, 'At least one attendee is required')

// Authentication schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string().min(1, 'Password is required').max(100, 'Password too long')
})

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Organization name too long'),
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password too long')
})

// Authentication response types
export interface AuthResponse {
  success: true
  data: {
    user: {
      id: string
      email: string
      organizationId: string
      organizationName: string
      role?: string
    }
    tokens: {
      accessToken: string
      refreshToken: string
    }
  }
}

export interface TokenVerificationResponse {
  success: true
  data: {
    user: {
      id: string
      email: string
      organizationId: string
      role?: string
    }
    isValid: boolean
  }
}

// Type inference from schemas
export type OrganizationCreate = z.infer<typeof OrganizationCreateSchema>
export type MemberCreate = z.infer<typeof MemberCreateSchema>
export type EventCreate = z.infer<typeof EventCreateSchema>
export type AttendanceRecordCreate = z.infer<typeof AttendanceRecordCreateSchema>
export type VerificationRecordCreate = z.infer<typeof VerificationRecordCreateSchema>
export type CSVAttendee = z.infer<typeof CSVAttendeeSchema>
export type CSVImport = z.infer<typeof CSVImportSchema>
export type LoginRequest = z.infer<typeof LoginSchema>
export type RegisterRequest = z.infer<typeof RegisterSchema>

// Validation result types
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: string[]
}

// Database operation result types
export interface DatabaseResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
