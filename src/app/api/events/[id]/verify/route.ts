import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/auth'
import { EventRepository, AttendanceRepository } from '@/lib/repositories'
import { DatabaseService } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyTokenFromRequest(request)
    if (!authResult.success || !authResult.data) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { participantId } = await request.json()

    if (!participantId || typeof participantId !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Participant ID is required' } },
        { status: 400 }
      )
    }

    const resolvedParams = await params
    const eventId = resolvedParams.id
    const { organizationId } = authResult.data

    // Get event details
    const schemaName = DatabaseService.sanitizeSchemaName(organizationId)
    const eventRepo = new EventRepository()
    const eventResult = await eventRepo.findById(schemaName, eventId)

    if (!eventResult.success || !eventResult.data) {
      return NextResponse.json(
        { success: false, error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      )
    }

    const event = eventResult.data

    // Check if event is active
    if (!event.isActive) {
      return NextResponse.json(
        { success: false, error: { code: 'EVENT_ARCHIVED', message: 'Cannot verify attendance for archived events' } },
        { status: 400 }
      )
    }

    // Initialize attendance repository for this event
    const attendanceRepo = new AttendanceRepository(organizationId, event.name)

    // Check if participant exists in attendance list
    const attendee = await attendanceRepo.findAttendeeById(participantId)

    if (!attendee) {
      return NextResponse.json(
        { success: false, error: { code: 'PARTICIPANT_NOT_FOUND', message: 'Participant ID not found in attendance list' } },
        { status: 404 }
      )
    }

    // Check if already verified (duplicate scan)
    const existingVerification = await attendanceRepo.findVerificationById(participantId)

    if (existingVerification) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DUPLICATE_SCAN', 
            message: `${attendee.name} has already been verified at ${new Date(existingVerification.verifiedAt).toLocaleString()}` 
          } 
        },
        { status: 400 }
      )
    }

    // Create verification record
    const verification = await attendanceRepo.createVerification({
      name: attendee.name,
      participantId: participantId,
      status: 'verified'
    })

    return NextResponse.json({
      success: true,
      message: `${attendee.name} verified successfully!`,
      data: {
        id: verification.id,
        name: attendee.name,
        participantId: participantId,
        status: 'verified',
        verifiedAt: verification.verifiedAt
      }
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}