import { NextRequest, NextResponse } from 'next/server'
import { AttendanceRepository, EventRepository } from '@/lib/repositories'
import { verifyToken } from '@/lib/auth'
import { CSVImportSchema } from '@/types'
import { DatabaseService } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success || !authResult.data) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { organizationId } = authResult.data
    const resolvedParams = await params
    const eventId = resolvedParams.id
    const body = await request.json()

    // Validate request body
    if (!body.attendees || !Array.isArray(body.attendees)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Attendees array is required' } },
        { status: 400 }
      )
    }

    // Validate attendees data
    const validation = CSVImportSchema.safeParse(body.attendees)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid attendee data',
            details: validation.error.issues
          } 
        },
        { status: 400 }
      )
    }

    const attendees = validation.data

    // Get organization schema name
    const schemaName = DatabaseService.sanitizeSchemaName(organizationId)

    // Get event details first
    const eventRepo = new EventRepository()
    const eventResult = await eventRepo.findById(schemaName, eventId)
    
    if (!eventResult.success || !eventResult.data) {
      return NextResponse.json(
        { success: false, error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      )
    }

    // Add attendees to the event
    const attendanceRepo = new AttendanceRepository(organizationId, eventResult.data.name)
    const results = []
    const errors = []

    for (const attendee of attendees) {
      const result = await attendanceRepo.create(schemaName, eventId, attendee)
      if (result.success) {
        results.push(result.data)
      } else {
        errors.push({
          attendee,
          error: result.error
        })
      }
    }

    // Return results
    if (errors.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          added: results.length,
          attendees: results
        }
      })
    } else if (results.length > 0) {
      // Partial success
      return NextResponse.json({
        success: true,
        data: {
          added: results.length,
          attendees: results,
          errors: errors
        }
      }, { status: 207 }) // Multi-status
    } else {
      // Complete failure
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'ATTENDEE_CREATION_FAILED', 
            message: 'Failed to add attendees',
            details: errors
          } 
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Add attendees API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success || !authResult.data) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { organizationId } = authResult.data
    const resolvedParams = await params
    const eventId = resolvedParams.id

    // Get organization schema name
    const schemaName = DatabaseService.sanitizeSchemaName(organizationId)

    // Get event details first
    const eventRepo = new EventRepository()
    const eventResult = await eventRepo.findById(schemaName, eventId)
    
    if (!eventResult.success || !eventResult.data) {
      return NextResponse.json(
        { success: false, error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      )
    }

    // Get attendees for the event
    const attendanceRepo = new AttendanceRepository(organizationId, eventResult.data.name)
    const result = await attendanceRepo.listByEvent(schemaName, eventId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to fetch attendees' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data || []
    })

  } catch (error) {
    console.error('Get attendees API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}