import { NextRequest, NextResponse } from 'next/server'
import { EventRepository } from '@/lib/repositories'
import { verifyToken } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'

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

    // Get event statistics
    const eventRepo = new EventRepository()
    const result = await eventRepo.getEventStats(schemaName, eventId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to fetch event statistics' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Event stats API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}