import { NextRequest, NextResponse } from 'next/server'
import { AttendanceRepository } from '@/lib/repositories'
import { verifyToken } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'
import { EventRepository } from '@/lib/repositories'

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

    // Get pagination parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Get organization schema name
    const schemaName = DatabaseService.sanitizeSchemaName(organizationId)

    // Get event to find verification table name
    const eventRepo = new EventRepository()
    const eventResult = await eventRepo.findById(schemaName, eventId)

    if (!eventResult.success || !eventResult.data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      )
    }

    // Get verification records
    const attendanceRepo = new AttendanceRepository(organizationId, eventResult.data.name)
    const result = await attendanceRepo.listVerifications(
      schemaName,
      eventResult.data.verificationTableName,
      page,
      limit
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to fetch verification records' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Event verifications API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}