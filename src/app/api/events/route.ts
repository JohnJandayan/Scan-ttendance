import { NextRequest, NextResponse } from 'next/server'
import { EventRepository } from '@/lib/repositories'
import { verifyTokenFromRequest } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active', 'archived', or null for all

    // Get organization schema name
    const schemaName = DatabaseService.sanitizeSchemaName(organizationId)

    // Get events for the organization based on status
    const eventRepo = new EventRepository()
    let result

    if (status === 'active') {
      result = await eventRepo.listActive(schemaName)
    } else if (status === 'archived') {
      result = await eventRepo.listArchived(schemaName)
    } else {
      result = await eventRepo.list(schemaName)
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to fetch events' } },
        { status: 500 }
      )
    }

    // For paginated results, return the data array, otherwise return the data directly
    const events = Array.isArray(result.data) ? result.data : result.data?.data || []

    return NextResponse.json({
      success: true,
      data: events
    })

  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyTokenFromRequest(request)
    if (!authResult.success || !authResult.data) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { userId, organizationId } = authResult.data
    const body = await request.json()

    // Validate request body
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Event name is required' } },
        { status: 400 }
      )
    }

    // Get organization schema name
    const schemaName = DatabaseService.sanitizeSchemaName(organizationId)

    // Create event
    const eventRepo = new EventRepository()
    const result = await eventRepo.create(schemaName, {
      name: body.name,
      creatorId: userId
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to create event' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    }, { status: 201 })

  } catch (error) {
    console.error('Create event API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}