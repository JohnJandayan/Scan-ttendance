import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/events/[id]/verify/route'
import { EventRepository, AttendanceRepository } from '@/lib/repositories'
import { verifyTokenFromRequest } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/auth')
vi.mock('@/lib/repositories')

const mockVerifyToken = vi.mocked(verifyTokenFromRequest)
const mockEventRepository = vi.mocked(EventRepository)
const mockAttendanceRepository = vi.mocked(AttendanceRepository)

describe('Attendance Verification API', () => {
  const mockUser = { id: 'org123', email: 'test@example.com' }
  const mockEvent = {
    id: 'event123',
    name: 'Test Event',
    isActive: true,
    creatorId: 'org123',
    createdAt: new Date(),
    attendanceTableName: 'test_event_attendance',
    verificationTableName: 'test_event_verification'
  }

  const mockAttendee = {
    id: 'attendee123',
    name: 'John Doe',
    participantId: 'PARTICIPANT123',
    createdAt: new Date()
  }

  const mockVerification = {
    id: 'verification123',
    name: 'John Doe',
    participantId: 'PARTICIPANT123',
    status: 'verified' as const,
    verifiedAt: new Date()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockVerifyToken.mockResolvedValue({ success: true, user: mockUser })
    
    const mockEventRepo = {
      findById: vi.fn().mockResolvedValue(mockEvent)
    }
    const mockAttendanceRepo = {
      findAttendeeById: vi.fn(),
      findVerificationById: vi.fn(),
      createVerification: vi.fn()
    }
    
    mockEventRepository.mockImplementation(() => mockEventRepo as any)
    mockAttendanceRepository.mockImplementation(() => mockAttendanceRepo as any)
  })

  it('should successfully verify attendance for valid participant', async () => {
    const mockEventRepo = new EventRepository('org123')
    const mockAttendanceRepo = new AttendanceRepository('org123', 'Test Event')
    
    vi.mocked(mockEventRepo.findById).mockResolvedValue(mockEvent)
    vi.mocked(mockAttendanceRepo.findAttendeeById).mockResolvedValue(mockAttendee)
    vi.mocked(mockAttendanceRepo.findVerificationById).mockResolvedValue(null)
    vi.mocked(mockAttendanceRepo.createVerification).mockResolvedValue(mockVerification)

    const request = new NextRequest('http://localhost/api/events/event123/verify', {
      method: 'POST',
      body: JSON.stringify({ participantId: 'PARTICIPANT123' })
    })

    const response = await POST(request, { params: { id: 'event123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('John Doe verified successfully!')
    expect(data.data.name).toBe('John Doe')
    expect(data.data.participantId).toBe('PARTICIPANT123')
    expect(data.data.status).toBe('verified')
  })

  it('should reject verification for unauthorized user', async () => {
    mockVerifyToken.mockResolvedValue({ success: false, error: 'Invalid token' })

    const request = new NextRequest('http://localhost/api/events/event123/verify', {
      method: 'POST',
      body: JSON.stringify({ participantId: 'PARTICIPANT123' })
    })

    const response = await POST(request, { params: { id: 'event123' } })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('UNAUTHORIZED')
  })

  it('should reject verification with missing participant ID', async () => {
    const request = new NextRequest('http://localhost/api/events/event123/verify', {
      method: 'POST',
      body: JSON.stringify({})
    })

    const response = await POST(request, { params: { id: 'event123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_INPUT')
    expect(data.error.message).toBe('Participant ID is required')
  })

  it('should reject verification with invalid participant ID type', async () => {
    const request = new NextRequest('http://localhost/api/events/event123/verify', {
      method: 'POST',
      body: JSON.stringify({ participantId: 123 })
    })

    const response = await POST(request, { params: { id: 'event123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_INPUT')
  })

  it('should reject verification for non-existent event', async () => {
    const mockEventRepo = new EventRepository('org123')
    vi.mocked(mockEventRepo.findById).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/events/nonexistent/verify', {
      method: 'POST',
      body: JSON.stringify({ participantId: 'PARTICIPANT123' })
    })

    const response = await POST(request, { params: { id: 'nonexistent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('EVENT_NOT_FOUND')
  })

  it('should reject verification for archived event', async () => {
    const archivedEvent = { ...mockEvent, isActive: false }
    const mockEventRepo = new EventRepository('org123')
    vi.mocked(mockEventRepo.findById).mockResolvedValue(archivedEvent)

    const request = new NextRequest('http://localhost/api/events/event123/verify', {
      method: 'POST',
      body: JSON.stringify({ participantId: 'PARTICIPANT123' })
    })

    const response = await POST(request, { params: { id: 'event123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('EVENT_ARCHIVED')
    expect(data.error.message).toBe('Cannot verify attendance for archived events')
  })

  it('should reject verification for participant not in attendance list', async () => {
    const mockEventRepo = new EventRepository('org123')
    const mockAttendanceRepo = new AttendanceRepository('org123', 'Test Event')
    
    vi.mocked(mockEventRepo.findById).mockResolvedValue(mockEvent)
    vi.mocked(mockAttendanceRepo.findAttendeeById).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/events/event123/verify', {
      method: 'POST',
      body: JSON.stringify({ participantId: 'INVALID123' })
    })

    const response = await POST(request, { params: { id: 'event123' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('PARTICIPANT_NOT_FOUND')
    expect(data.error.message).toBe('Participant ID not found in attendance list')
  })

  it('should detect duplicate scan attempts', async () => {
    const existingVerification = {
      ...mockVerification,
      verifiedAt: new Date('2024-01-15T10:30:00Z')
    }

    const mockEventRepo = new EventRepository('org123')
    const mockAttendanceRepo = new AttendanceRepository('org123', 'Test Event')
    
    vi.mocked(mockEventRepo.findById).mockResolvedValue(mockEvent)
    vi.mocked(mockAttendanceRepo.findAttendeeById).mockResolvedValue(mockAttendee)
    vi.mocked(mockAttendanceRepo.findVerificationById).mockResolvedValue(existingVerification)

    const request = new NextRequest('http://localhost/api/events/event123/verify', {
      method: 'POST',
      body: JSON.stringify({ participantId: 'PARTICIPANT123' })
    })

    const response = await POST(request, { params: { id: 'event123' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('DUPLICATE_SCAN')
    expect(data.error.message).toContain('John Doe has already been verified')
    expect(data.error.message).toContain('1/15/2024')
  })

  it('should handle database errors gracefully', async () => {
    const mockEventRepo = new EventRepository('org123')
    vi.mocked(mockEventRepo.findById).mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost/api/events/event123/verify', {
      method: 'POST',
      body: JSON.stringify({ participantId: 'PARTICIPANT123' })
    })

    const response = await POST(request, { params: { id: 'event123' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
    expect(data.error.message).toBe('Internal server error')
  })

  it('should handle verification creation errors', async () => {
    const mockEventRepo = new EventRepository('org123')
    const mockAttendanceRepo = new AttendanceRepository('org123', 'Test Event')
    
    vi.mocked(mockEventRepo.findById).mockResolvedValue(mockEvent)
    vi.mocked(mockAttendanceRepo.findAttendeeById).mockResolvedValue(mockAttendee)
    vi.mocked(mockAttendanceRepo.findVerificationById).mockResolvedValue(null)
    vi.mocked(mockAttendanceRepo.createVerification).mockRejectedValue(new Error('Failed to create verification'))

    const request = new NextRequest('http://localhost/api/events/event123/verify', {
      method: 'POST',
      body: JSON.stringify({ participantId: 'PARTICIPANT123' })
    })

    const response = await POST(request, { params: { id: 'event123' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })

  it('should validate participant ID format', async () => {
    const testCases = [
      { participantId: '', expectedError: 'Participant ID is required' },
      { participantId: null, expectedError: 'Participant ID is required' },
      { participantId: undefined, expectedError: 'Participant ID is required' },
      { participantId: [], expectedError: 'Participant ID is required' },
      { participantId: {}, expectedError: 'Participant ID is required' }
    ]

    for (const testCase of testCases) {
      const request = new NextRequest('http://localhost/api/events/event123/verify', {
        method: 'POST',
        body: JSON.stringify({ participantId: testCase.participantId })
      })

      const response = await POST(request, { params: { id: 'event123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_INPUT')
      expect(data.error.message).toBe(testCase.expectedError)
    }
  })

  it('should include timestamp in verification response', async () => {
    const mockEventRepo = new EventRepository('org123')
    const mockAttendanceRepo = new AttendanceRepository('org123', 'Test Event')
    
    vi.mocked(mockEventRepo.findById).mockResolvedValue(mockEvent)
    vi.mocked(mockAttendanceRepo.findAttendeeById).mockResolvedValue(mockAttendee)
    vi.mocked(mockAttendanceRepo.findVerificationById).mockResolvedValue(null)
    vi.mocked(mockAttendanceRepo.createVerification).mockResolvedValue(mockVerification)

    const request = new NextRequest('http://localhost/api/events/event123/verify', {
      method: 'POST',
      body: JSON.stringify({ participantId: 'PARTICIPANT123' })
    })

    const response = await POST(request, { params: { id: 'event123' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.verifiedAt).toBeDefined()
    expect(new Date(data.data.verifiedAt)).toBeInstanceOf(Date)
  })

  it('should handle malformed JSON request body', async () => {
    const request = new NextRequest('http://localhost/api/events/event123/verify', {
      method: 'POST',
      body: 'invalid json'
    })

    const response = await POST(request, { params: { id: 'event123' } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INTERNAL_ERROR')
  })
})