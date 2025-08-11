import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  sanitizeString,
  sanitizeHtml,
  sanitizeEmail,
  sanitizeOrganizationName,
  sanitizeEventName,
  sanitizeParticipantId,
  escapeIdentifier,
  validateTableName,
  validateSchemaName,
  authSchemas,
  eventSchemas,
  memberSchemas,
  scanSchemas,
  rateLimiters
} from '@/lib/security'

describe('Security Utilities', () => {
  describe('sanitizeString', () => {
    it('should remove control characters', () => {
      const input = 'Hello\x00\x08\x0B\x0C\x0E\x1F\x7FWorld'
      const result = sanitizeString(input)
      expect(result).toBe('HelloWorld')
    })

    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const result = sanitizeString(input)
      expect(result).toBe('Hello World')
    })

    it('should limit length to prevent DoS', () => {
      const input = 'a'.repeat(20000)
      const result = sanitizeString(input)
      expect(result.length).toBe(10000)
    })

    it('should return empty string for non-string input', () => {
      expect(sanitizeString(null as any)).toBe('')
      expect(sanitizeString(undefined as any)).toBe('')
      expect(sanitizeString(123 as any)).toBe('')
    })
  })

  describe('sanitizeHtml', () => {
    it('should remove all HTML tags', () => {
      const input = '<script>alert("xss")</script><p>Hello</p>'
      const result = sanitizeHtml(input)
      expect(result).toBe('Hello') // DOMPurify removes script content entirely
    })

    it('should handle non-string input', () => {
      expect(sanitizeHtml(null as any)).toBe('')
      expect(sanitizeHtml(undefined as any)).toBe('')
    })
  })

  describe('sanitizeEmail', () => {
    it('should convert to lowercase', () => {
      const input = 'TEST@EXAMPLE.COM'
      const result = sanitizeEmail(input)
      expect(result).toBe('test@example.com')
    })

    it('should throw error for invalid email format', () => {
      expect(() => sanitizeEmail('invalid-email')).toThrow('Invalid email format')
      expect(() => sanitizeEmail('test@')).toThrow('Invalid email format')
      expect(() => sanitizeEmail('@example.com')).toThrow('Invalid email format')
    })

    it('should accept valid email formats', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com')
      expect(sanitizeEmail('user.name+tag@example.co.uk')).toBe('user.name+tag@example.co.uk')
    })
  })

  describe('sanitizeOrganizationName', () => {
    it('should remove special characters', () => {
      const input = 'My Org! @#$%^&*()'
      const result = sanitizeOrganizationName(input)
      expect(result).toBe('My Org')
    })

    it('should throw error for too short name', () => {
      expect(() => sanitizeOrganizationName('A')).toThrow('Organization name must be at least 2 characters')
    })

    it('should throw error for too long name', () => {
      const input = 'a'.repeat(150)
      expect(() => sanitizeOrganizationName(input)).toThrow('Organization name must be less than 100 characters')
    })

    it('should allow valid organization names', () => {
      expect(sanitizeOrganizationName('My Company Inc')).toBe('My Company Inc')
      expect(sanitizeOrganizationName('Tech-Corp_2024')).toBe('Tech-Corp_2024')
    })
  })

  describe('sanitizeEventName', () => {
    it('should remove special characters', () => {
      const input = 'Event Name! @#$%'
      const result = sanitizeEventName(input)
      expect(result).toBe('Event Name')
    })

    it('should throw error for empty name', () => {
      expect(() => sanitizeEventName('')).toThrow('Event name is required')
      expect(() => sanitizeEventName('!@#$%')).toThrow('Event name is required')
    })

    it('should throw error for too long name', () => {
      const input = 'a'.repeat(150)
      expect(() => sanitizeEventName(input)).toThrow('Event name must be less than 100 characters')
    })
  })

  describe('sanitizeParticipantId', () => {
    it('should remove special characters', () => {
      const input = 'ID123!@#$%'
      const result = sanitizeParticipantId(input)
      expect(result).toBe('ID123')
    })

    it('should throw error for empty ID', () => {
      expect(() => sanitizeParticipantId('')).toThrow('Participant ID is required')
      expect(() => sanitizeParticipantId('!@#$%')).toThrow('Participant ID is required')
    })

    it('should throw error for too long ID', () => {
      const input = 'a'.repeat(60)
      expect(() => sanitizeParticipantId(input)).toThrow('Participant ID must be less than 50 characters')
    })
  })

  describe('escapeIdentifier', () => {
    it('should remove invalid characters', () => {
      const input = 'table_name!@#$%'
      const result = escapeIdentifier(input)
      expect(result).toBe('table_name')
    })

    it('should throw error for identifier starting with number', () => {
      expect(() => escapeIdentifier('123table')).toThrow('Identifier cannot start with a number')
    })

    it('should throw error for empty identifier', () => {
      expect(() => escapeIdentifier('')).toThrow('Identifier cannot be empty')
      expect(() => escapeIdentifier('!@#$%')).toThrow('Identifier cannot be empty')
    })

    it('should throw error for too long identifier', () => {
      const input = 'a'.repeat(70)
      expect(() => escapeIdentifier(input)).toThrow('Identifier is too long')
    })
  })

  describe('validateTableName', () => {
    it('should reject reserved words', () => {
      expect(() => validateTableName('user')).toThrow('Table name cannot be a reserved word')
      expect(() => validateTableName('select')).toThrow('Table name cannot be a reserved word')
      expect(() => validateTableName('DROP')).toThrow('Table name cannot be a reserved word')
    })

    it('should accept valid table names', () => {
      expect(validateTableName('my_table')).toBe('my_table')
      expect(validateTableName('event_attendance')).toBe('event_attendance')
    })
  })

  describe('validateSchemaName', () => {
    it('should require org_ prefix', () => {
      expect(() => validateSchemaName('company')).toThrow('Schema name must start with org_')
    })

    it('should accept valid schema names', () => {
      expect(validateSchemaName('org_company')).toBe('org_company')
      expect(validateSchemaName('org_test_123')).toBe('org_test_123')
    })
  })

  describe('Validation Schemas', () => {
    describe('authSchemas.register', () => {
      it('should validate valid registration data', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          organizationName: 'My Company',
          password: 'Password123'
        }

        const result = authSchemas.register.parse(validData)
        expect(result.name).toBe('John Doe')
        expect(result.email).toBe('john@example.com')
        expect(result.organizationName).toBe('My Company')
        expect(result.password).toBe('Password123')
      })

      it('should reject invalid password', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          organizationName: 'My Company',
          password: 'weak'
        }

        expect(() => authSchemas.register.parse(invalidData)).toThrow()
      })

      it('should reject invalid email', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'invalid-email',
          organizationName: 'My Company',
          password: 'Password123'
        }

        expect(() => authSchemas.register.parse(invalidData)).toThrow()
      })
    })

    describe('eventSchemas.create', () => {
      it('should validate valid event data', () => {
        const validData = {
          name: 'My Event',
          description: 'Event description'
        }

        const result = eventSchemas.create.parse(validData)
        expect(result.name).toBe('My Event')
        expect(result.description).toBe('Event description')
      })

      it('should reject empty event name', () => {
        const invalidData = {
          name: '',
          description: 'Event description'
        }

        expect(() => eventSchemas.create.parse(invalidData)).toThrow()
      })
    })

    describe('eventSchemas.addAttendees', () => {
      it('should validate valid attendees data', () => {
        const validData = {
          attendees: [
            { name: 'John Doe', participantId: 'ID123' },
            { name: 'Jane Smith', participantId: 'ID456' }
          ]
        }

        const result = eventSchemas.addAttendees.parse(validData)
        expect(result.attendees).toHaveLength(2)
        expect(result.attendees[0].name).toBe('John Doe')
        expect(result.attendees[0].participantId).toBe('ID123')
      })

      it('should reject too many attendees', () => {
        const invalidData = {
          attendees: Array(1001).fill({ name: 'Test', participantId: 'ID123' })
        }

        expect(() => eventSchemas.addAttendees.parse(invalidData)).toThrow()
      })
    })

    describe('memberSchemas.create', () => {
      it('should validate valid member data', () => {
        const validData = {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'manager' as const
        }

        const result = memberSchemas.create.parse(validData)
        expect(result.name).toBe('John Doe')
        expect(result.email).toBe('john@example.com')
        expect(result.role).toBe('manager')
      })

      it('should reject invalid role', () => {
        const invalidData = {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'invalid_role'
        }

        expect(() => memberSchemas.create.parse(invalidData)).toThrow()
      })
    })

    describe('scanSchemas.verify', () => {
      it('should validate valid scan data', () => {
        const validData = {
          participantId: 'ID123',
          eventId: '550e8400-e29b-41d4-a716-446655440000'
        }

        const result = scanSchemas.verify.parse(validData)
        expect(result.participantId).toBe('ID123')
        expect(result.eventId).toBe('550e8400-e29b-41d4-a716-446655440000')
      })

      it('should reject invalid UUID', () => {
        const invalidData = {
          participantId: 'ID123',
          eventId: 'invalid-uuid'
        }

        expect(() => scanSchemas.verify.parse(invalidData)).toThrow()
      })
    })
  })

  describe('Rate Limiters', () => {
    beforeEach(() => {
      // Clear rate limiter state
      Object.values(rateLimiters).forEach(limiter => {
        limiter['limits'].clear()
      })
    })

    it('should allow requests within limit', () => {
      const limiter = rateLimiters.api
      const identifier = 'test-user'

      // First request should be allowed
      expect(limiter.isAllowed(identifier)).toBe(true)
      
      // Should have remaining requests
      expect(limiter.getRemainingRequests(identifier)).toBeLessThan(60)
    })

    it('should block requests exceeding limit', () => {
      const limiter = rateLimiters.auth
      const identifier = 'test-user'

      // Use up all allowed requests
      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed(identifier)).toBe(true)
      }

      // Next request should be blocked
      expect(limiter.isAllowed(identifier)).toBe(false)
      expect(limiter.getRemainingRequests(identifier)).toBe(0)
    })

    it('should reset after window expires', () => {
      vi.useFakeTimers()
      
      const limiter = rateLimiters.auth
      const identifier = 'test-user'

      // Use up all requests
      for (let i = 0; i < 5; i++) {
        limiter.isAllowed(identifier)
      }
      expect(limiter.isAllowed(identifier)).toBe(false)

      // Fast forward past the window
      vi.advanceTimersByTime(16 * 60 * 1000) // 16 minutes

      // Should be allowed again
      expect(limiter.isAllowed(identifier)).toBe(true)
      
      vi.useRealTimers()
    })

    it('should clean up expired entries', () => {
      vi.useFakeTimers()
      
      const limiter = rateLimiters.api
      const identifier = 'test-user'

      // Make a request
      limiter.isAllowed(identifier)
      expect(limiter['limits'].has(identifier)).toBe(true)

      // Fast forward past expiration
      vi.advanceTimersByTime(2 * 60 * 1000) // 2 minutes

      // Cleanup should remove expired entries
      limiter.cleanup()
      expect(limiter['limits'].has(identifier)).toBe(false)
      
      vi.useRealTimers()
    })
  })
})