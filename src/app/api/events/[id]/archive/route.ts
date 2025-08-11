import { NextRequest, NextResponse } from 'next/server'
import { EventRepository } from '@/lib/repositories'
import { verifyTokenFromRequest } from '@/lib/auth'
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

    const { organizationId } = authResult.data
    const resolvedParams = await params
    const eventId = resolvedParams.id

    // Get organization schema name
    const schemaName = DatabaseService.sanitizeSchemaName(organizationId)

    // End/archive the event
    const eventRepo = new EventRepository()
    const result = await eventRepo.endEvent(schemaName, eventId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to archive event' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Archive event API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { organizationId } = authResult.data
    const resolvedParams = await params
    const eventId = resolvedParams.id

    // Get organization schema name
    const schemaName = DatabaseService.sanitizeSchemaName(organizationId)

    // Reactivate the event
    const eventRepo = new EventRepository()
    const result = await eventRepo.reactivateEvent(schemaName, eventId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to reactivate event' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Reactivate event API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}