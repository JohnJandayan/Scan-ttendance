import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OrganizationRepository, MemberRepository, EventRepository, AttendanceRepository } from '../lib/repositories'

// Mock Supabase client
const mockSupabaseClient = {
  rpc: vi.fn()
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}))

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true)
  }
}))

// Mock DatabaseService
vi.mock('../lib/database', () => ({
  DatabaseService: {
    sanitizeSchemaName: vi.fn((name: string) => `org_${name.toLowerCase()}`),
    sanitizeTableName: vi.fn((name: string) => name.toLowerCase()),
    createOrganizationSchema: vi.fn().mockResolvedValue({ success: true, schemaName: 'org_test' }),
    dropOrganizationSchema: vi.fn().mockResolvedValue({ success: true }),
    createEventTables: vi.fn().mockResolvedValue({ success: true }),
    dropEventTables: vi.fn().mockResolvedValue({ success: true })
  }
}))

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Repository Classes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('OrganizationRepository', () => {
    let orgRepo: OrganizationRepository

    beforeEach(() => {
      orgRepo = new OrganizationRepository()
    })

    describe('create', () => {
      it('should create organization successfully', async () => {
        // Mock findByEmail to return no existing organization
        mockSupabaseClient.rpc.mockResolvedValueOnce({ data: [], error: null })
        // Mock insert query
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: {
            id: '123',
            name: 'Test Company',
            email: 'test@company.com',
            password_hash: 'hashed-password',
            schema: 'org_test_company',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          error: null
        })

        const result = await orgRepo.create({
          name: 'Test Company',
          email: 'test@company.com',
          password: 'password123'
        })

        expect(result.success).toBe(true)
        expect(result.data?.name).toBe('Test Company')
        expect(result.data?.email).toBe('test@company.com')
      })

      it('should reject duplicate email', async () => {
        // Mock findByEmail to return existing organization
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [{ id: '123', email: 'test@company.com' }],
          error: null
        })

        const result = await orgRepo.create({
          name: 'Test Company',
          email: 'test@company.com',
          password: 'password123'
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('already exists')
      })

      it('should validate input data', async () => {
        const result = await orgRepo.create({
          name: '',
          email: 'invalid-email',
          password: '123'
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('Validation failed')
      })
    })

    describe('findById', () => {
      it('should find organization by ID', async () => {
        const mockOrg = {
          id: '123',
          name: 'Test Company',
          email: 'test@company.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [mockOrg],
          error: null
        })

        const result = await orgRepo.findById('123')

        expect(result.success).toBe(true)
        expect(result.data?.id).toBe('123')
        expect(result.data?.name).toBe('Test Company')
      })

      it('should return null for non-existent organization', async () => {
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [],
          error: null
        })

        const result = await orgRepo.findById('non-existent')

        expect(result.success).toBe(true)
        expect(result.data).toBeNull()
      })
    })

    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        const mockOrg = {
          id: '123',
          name: 'Test Company',
          email: 'test@company.com',
          passwordHash: 'hashed-password',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [mockOrg],
          error: null
        })

        const result = await orgRepo.verifyPassword('test@company.com', 'password123')

        expect(result.success).toBe(true)
        expect(result.data?.email).toBe('test@company.com')
      })
    })
  })

  describe('MemberRepository', () => {
    let memberRepo: MemberRepository

    beforeEach(() => {
      memberRepo = new MemberRepository()
    })

    describe('create', () => {
      it('should create member successfully', async () => {
        // Mock findByEmail to return no existing member
        mockSupabaseClient.rpc.mockResolvedValueOnce({ data: [], error: null })
        // Mock insert query
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: {
            id: '123',
            org_id: 'org-123',
            name: 'John Doe',
            email: 'john@company.com',
            role: 'manager',
            created_at: new Date().toISOString()
          },
          error: null
        })

        const result = await memberRepo.create('org_test', {
          orgId: 'org-123',
          name: 'John Doe',
          email: 'john@company.com',
          role: 'manager'
        })

        expect(result.success).toBe(true)
        expect(result.data?.name).toBe('John Doe')
        expect(result.data?.role).toBe('manager')
      })

      it('should validate member data', async () => {
        const result = await memberRepo.create('org_test', {
          orgId: 'org-123',
          name: '',
          email: 'invalid-email',
          role: 'invalid-role' as any
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('Validation failed')
      })
    })

    describe('listByRole', () => {
      it('should list members by role', async () => {
        const mockMembers = [
          {
            id: '123',
            name: 'John Doe',
            role: 'manager',
            created_at: new Date().toISOString()
          }
        ]

        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: mockMembers,
          error: null
        })

        const result = await memberRepo.listByRole('org_test', 'manager')

        expect(result.success).toBe(true)
        expect(result.data).toHaveLength(1)
        expect(result.data?.[0].role).toBe('manager')
      })
    })
  })

  describe('EventRepository', () => {
    let eventRepo: EventRepository

    beforeEach(() => {
      eventRepo = new EventRepository()
    })

    describe('create', () => {
      it('should create event successfully', async () => {
        // Mock findByName to return no existing event
        mockSupabaseClient.rpc.mockResolvedValueOnce({ data: [], error: null })
        // Mock insert query
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: {
            id: '123',
            name: 'Annual Meeting',
            creator_id: 'creator-123',
            created_at: new Date().toISOString(),
            ended_at: null,
            is_active: true,
            attendance_table_name: 'annual_meeting_attendance',
            verification_table_name: 'annual_meeting_verification'
          },
          error: null
        })

        const result = await eventRepo.create('org_test', {
          name: 'Annual Meeting',
          creatorId: 'creator-123'
        })

        expect(result.success).toBe(true)
        expect(result.data?.name).toBe('Annual Meeting')
        expect(result.data?.isActive).toBe(true)
      })

      it('should validate event data', async () => {
        const result = await eventRepo.create('org_test', {
          name: '',
          creatorId: 'invalid-uuid'
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('Validation failed')
      })
    })

    describe('endEvent', () => {
      it('should end event successfully', async () => {
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: {
            id: '123',
            name: 'Annual Meeting',
            is_active: false,
            ended_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          },
          error: null
        })

        const result = await eventRepo.endEvent('org_test', '123')

        expect(result.success).toBe(true)
        expect(result.data?.isActive).toBe(false)
        expect(result.data?.endedAt).toBeDefined()
      })
    })

    describe('getEventStats', () => {
      it('should get event statistics', async () => {
        // Mock findById
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [{
            id: '123',
            name: 'Annual Meeting',
            attendanceTableName: 'annual_meeting_attendance',
            verificationTableName: 'annual_meeting_verification',
            created_at: new Date().toISOString()
          }],
          error: null
        })

        // Mock total attendees query
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [{ count: 100 }],
          error: null
        })

        // Mock verified attendees query
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [{ count: 75 }],
          error: null
        })

        const result = await eventRepo.getEventStats('org_test', '123')

        expect(result.success).toBe(true)
        expect(result.data?.totalAttendees).toBe(100)
        expect(result.data?.verifiedAttendees).toBe(75)
        expect(result.data?.verificationRate).toBe(75)
      })
    })
  })

  describe('AttendanceRepository', () => {
    let attendanceRepo: AttendanceRepository

    beforeEach(() => {
      attendanceRepo = new AttendanceRepository()
    })

    describe('addAttendee', () => {
      it('should add attendee successfully', async () => {
        // Mock findByParticipantId to return no existing attendee
        mockSupabaseClient.rpc.mockResolvedValueOnce({ data: [], error: null })
        // Mock insert query
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: {
            id: '123',
            name: 'John Doe',
            participant_id: 'PART001',
            created_at: new Date().toISOString()
          },
          error: null
        })

        const result = await attendanceRepo.addAttendee('org_test', 'event_attendance', {
          name: 'John Doe',
          participantId: 'PART001'
        })

        expect(result.success).toBe(true)
        expect(result.data?.name).toBe('John Doe')
        expect(result.data?.participantId).toBe('PART001')
      })

      it('should reject duplicate participant ID', async () => {
        // Mock findByParticipantId to return existing attendee
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [{ id: '123', participant_id: 'PART001' }],
          error: null
        })

        const result = await attendanceRepo.addAttendee('org_test', 'event_attendance', {
          name: 'John Doe',
          participantId: 'PART001'
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('already exists')
      })
    })

    describe('verifyAttendance', () => {
      it('should verify attendance successfully', async () => {
        // Mock findByParticipantId to return attendee
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [{
            id: '123',
            name: 'John Doe',
            participant_id: 'PART001',
            created_at: new Date().toISOString()
          }],
          error: null
        })

        // Mock findVerificationByParticipantId to return no existing verification
        mockSupabaseClient.rpc.mockResolvedValueOnce({ data: [], error: null })

        // Mock insert verification query
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: {
            id: '456',
            name: 'John Doe',
            participant_id: 'PART001',
            status: 'verified',
            verified_at: new Date().toISOString()
          },
          error: null
        })

        const result = await attendanceRepo.verifyAttendance(
          'org_test',
          'event_attendance',
          'event_verification',
          'PART001'
        )

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('verified')
        expect(result.data?.verification.status).toBe('verified')
      })

      it('should handle duplicate verification', async () => {
        // Mock findByParticipantId to return attendee
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [{
            id: '123',
            name: 'John Doe',
            participant_id: 'PART001',
            created_at: new Date().toISOString()
          }],
          error: null
        })

        // Mock findVerificationByParticipantId to return existing verification
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: [{
            id: '456',
            participant_id: 'PART001',
            status: 'verified',
            verified_at: new Date().toISOString()
          }],
          error: null
        })

        // Mock insert verification query
        mockSupabaseClient.rpc.mockResolvedValueOnce({
          data: {
            id: '789',
            name: 'John Doe',
            participant_id: 'PART001',
            status: 'duplicate',
            verified_at: new Date().toISOString()
          },
          error: null
        })

        const result = await attendanceRepo.verifyAttendance(
          'org_test',
          'event_attendance',
          'event_verification',
          'PART001'
        )

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('duplicate')
      })

      it('should handle participant not found', async () => {
        // Mock findByParticipantId to return no attendee
        mockSupabaseClient.rpc.mockResolvedValueOnce({ data: [], error: null })

        const result = await attendanceRepo.verifyAttendance(
          'org_test',
          'event_attendance',
          'event_verification',
          'PART001'
        )

        expect(result.success).toBe(false)
        expect(result.error).toContain('not found in attendance list')
      })
    })

    describe('bulkImportAttendees', () => {
      it('should import valid CSV data', async () => {
        const csvData = [
          { name: 'John Doe', participantId: 'PART001' },
          { name: 'Jane Smith', participantId: 'PART002' }
        ]

        // Mock successful imports
        mockSupabaseClient.rpc
          .mockResolvedValueOnce({ data: [], error: null }) // findByParticipantId for PART001
          .mockResolvedValueOnce({ // insert PART001
            data: {
              id: '123',
              name: 'John Doe',
              participant_id: 'PART001',
              created_at: new Date().toISOString()
            },
            error: null
          })
          .mockResolvedValueOnce({ data: [], error: null }) // findByParticipantId for PART002
          .mockResolvedValueOnce({ // insert PART002
            data: {
              id: '124',
              name: 'Jane Smith',
              participant_id: 'PART002',
              created_at: new Date().toISOString()
            },
            error: null
          })

        const result = await attendanceRepo.bulkImportAttendees('org_test', 'event_attendance', csvData)

        expect(result.success).toBe(true)
        expect(result.data?.imported).toHaveLength(2)
        expect(result.data?.errors).toHaveLength(0)
        expect(result.data?.duplicates).toHaveLength(0)
      })
    })
  })
})