import { describe, it, expect } from 'vitest'
import {
  validateData,
  validateDataSafe,
  validateArray,
  validateCSVData,
  sanitizeInput,
  validateEmail,
  validateParticipantId
} from '../lib/validation'
import {
  OrganizationCreateSchema,
  MemberCreateSchema,
  EventCreateSchema,
  AttendanceRecordCreateSchema,
  VerificationRecordCreateSchema
} from '../types/index'

describe('Validation Functions', () => {
  describe('validateData', () => {
    it('should validate valid organization data', () => {
      const validData = {
        name: 'Test Company',
        email: 'test@company.com',
        password: 'password123'
      }

      const result = validateData(OrganizationCreateSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(validData)
      expect(result.errors).toBeUndefined()
    })

    it('should reject invalid organization data', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        password: '123' // too short
      }

      const result = validateData(OrganizationCreateSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
      expect(result.errors?.length).toBeGreaterThan(0)
    })

    it('should validate valid member data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@company.com',
        role: 'manager' as const
      }

      const result = validateData(MemberCreateSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(validData)
    })

    it('should reject invalid member role', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@company.com',
        role: 'invalid-role'
      }

      const result = validateData(MemberCreateSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should validate valid event data', () => {
      const validData = {
        name: 'Annual Meeting',
        creatorId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = validateData(EventCreateSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(validData)
    })

    it('should reject invalid UUID in event data', () => {
      const invalidData = {
        name: 'Annual Meeting',
        creatorId: 'invalid-uuid'
      }

      const result = validateData(EventCreateSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should validate valid attendance record data', () => {
      const validData = {
        name: 'John Doe',
        participantId: 'PART001'
      }

      const result = validateData(AttendanceRecordCreateSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(validData)
    })

    it('should validate valid verification record data', () => {
      const validData = {
        name: 'John Doe',
        participantId: 'PART001',
        status: 'verified' as const
      }

      const result = validateData(VerificationRecordCreateSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(validData)
    })
  })

  describe('validateArray', () => {
    it('should validate array of valid data', () => {
      const validArray = [
        { name: 'John Doe', participantId: 'PART001' },
        { name: 'Jane Smith', participantId: 'PART002' }
      ]

      const result = validateArray(AttendanceRecordCreateSchema, validArray)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(validArray)
      expect(result.errors).toBeUndefined()
    })

    it('should handle mixed valid and invalid data', () => {
      const mixedArray = [
        { name: 'John Doe', participantId: 'PART001' }, // valid
        { name: '', participantId: 'PART002' }, // invalid - empty name
        { name: 'Jane Smith', participantId: 'PART003' } // valid
      ]

      const result = validateArray(AttendanceRecordCreateSchema, mixedArray)

      expect(result.success).toBe(false)
      expect(result.data).toHaveLength(2) // only valid items
      expect(result.errors).toBeDefined()
      expect(result.errors?.some(error => error.includes('Item 2'))).toBe(true)
    })
  })

  describe('validateCSVData', () => {
    it('should validate valid CSV data', () => {
      const csvData = [
        { name: 'John Doe', participantId: 'PART001' },
        { name: 'Jane Smith', participantId: 'PART002' }
      ]

      const result = validateCSVData(csvData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual([
        { name: 'John Doe', participantId: 'PART001' },
        { name: 'Jane Smith', participantId: 'PART002' }
      ])
    })

    it('should handle flexible field names', () => {
      const csvData = [
        { Name: 'John Doe', ID: 'PART001' },
        { 'Participant Name': 'Jane Smith', 'Participant ID': 'PART002' }
      ]

      const result = validateCSVData(csvData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual([
        { name: 'John Doe', participantId: 'PART001' },
        { name: 'Jane Smith', participantId: 'PART002' }
      ])
    })

    it('should detect duplicate participant IDs', () => {
      const csvData = [
        { name: 'John Doe', participantId: 'PART001' },
        { name: 'Jane Smith', participantId: 'PART001' } // duplicate ID
      ]

      const result = validateCSVData(csvData)

      expect(result.success).toBe(true) // Still successful but with errors
      expect(result.data).toHaveLength(1) // Only first record
      expect(result.errors).toBeDefined()
      expect(result.errors?.some(error => error.includes('Duplicate participant ID'))).toBe(true)
    })

    it('should reject empty CSV data', () => {
      const result = validateCSVData([])

      expect(result.success).toBe(false)
      expect(result.errors?.some(error => error.includes('non-empty array'))).toBe(true)
    })

    it('should handle missing required fields', () => {
      const csvData = [
        { name: 'John Doe' }, // missing participantId
        { participantId: 'PART002' } // missing name
      ]

      const result = validateCSVData(csvData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.some(error => error.includes('Name is required'))).toBe(true)
      expect(result.errors?.some(error => error.includes('Participant ID is required'))).toBe(true)
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = 'Hello <script>alert("xss")</script> World'
      const result = sanitizeInput(input)
      expect(result).toBe('Hello scriptalert(xss)/script World')
    })

    it('should remove quotes', () => {
      const input = 'Hello "World" and \'Universe\''
      const result = sanitizeInput(input)
      expect(result).toBe('Hello World and Universe')
    })

    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const result = sanitizeInput(input)
      expect(result).toBe('Hello World')
    })

    it('should limit length', () => {
      const input = 'a'.repeat(1500)
      const result = sanitizeInput(input)
      expect(result.length).toBe(1000)
    })

    it('should handle non-string input', () => {
      const result = sanitizeInput(123 as any)
      expect(result).toBe('')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = validateEmail('test@example.com')
      expect(result.success).toBe(true)
      expect(result.data).toBe('test@example.com')
    })

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email')
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should reject email with consecutive dots', () => {
      const result = validateEmail('test..email@example.com')
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should reject email starting with dot', () => {
      const result = validateEmail('.test@example.com')
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should convert to lowercase', () => {
      const result = validateEmail('TEST@EXAMPLE.COM')
      expect(result.success).toBe(true)
      expect(result.data).toBe('test@example.com')
    })
  })

  describe('validateParticipantId', () => {
    it('should validate correct participant ID', () => {
      const result = validateParticipantId('PART001')
      expect(result.success).toBe(true)
      expect(result.data).toBe('PART001')
    })

    it('should accept alphanumeric with hyphens and underscores', () => {
      const result = validateParticipantId('PART-001_A')
      expect(result.success).toBe(true)
      expect(result.data).toBe('PART-001_A')
    })

    it('should reject non-string input', () => {
      const result = validateParticipantId(123 as any)
      expect(result.success).toBe(false)
      expect(result.errors?.some(error => error.includes('must be a string'))).toBe(true)
    })

    it('should reject empty string', () => {
      const result = validateParticipantId('')
      expect(result.success).toBe(false)
      expect(result.errors?.some(error => error.includes('cannot be empty'))).toBe(true)
    })

    it('should reject too long ID', () => {
      const longId = 'a'.repeat(300)
      const result = validateParticipantId(longId)
      expect(result.success).toBe(false)
      expect(result.errors?.some(error => error.includes('too long'))).toBe(true)
    })

    it('should reject invalid characters', () => {
      const result = validateParticipantId('PART@001')
      expect(result.success).toBe(false)
      expect(result.errors?.some(error => error.includes('can only contain'))).toBe(true)
    })

    it('should sanitize input', () => {
      const result = validateParticipantId('  PART001  ')
      expect(result.success).toBe(true)
      expect(result.data).toBe('PART001')
    })
  })
})