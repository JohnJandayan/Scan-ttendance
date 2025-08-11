import { NextRequest, NextResponse } from 'next/server'
import { EventRepository } from '@/lib/repositories'
import { verifyTokenFromRequest } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'

export async function GET(
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

    // Get event details
    const eventRepo = new EventRepository()
    const result = await eventRepo.findById(schemaName, eventId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to fetch event' } },
        { status: 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Event API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const body = await request.json()

    // Get organization schema name
    const schemaName = DatabaseService.sanitizeSchemaName(organizationId)

    // Update event
    const eventRepo = new EventRepository()
    const result = await eventRepo.update(schemaName, eventId, body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to update event' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Update event API error:', error)
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

    // Delete event
    const eventRepo = new EventRepository()
    const result = await eventRepo.delete(schemaName, eventId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to delete event' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true }
    })

  } catch (error) {
    console.error('Delete event API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}