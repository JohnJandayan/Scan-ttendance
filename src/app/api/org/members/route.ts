import { NextRequest, NextResponse } from 'next/server'
import { MemberRepository } from '@/lib/repositories'
import { verifyToken } from '@/lib/auth'
import { MemberCreateSchema } from '@/types'
import { DatabaseService } from '@/lib/database'

export async function GET(request: NextRequest) {
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

    // Get members for the organization
    const memberRepo = new MemberRepository()
    const result = await memberRepo.findByOrganization(organizationId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to fetch members' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data || []
    })

  } catch (error) {
    console.error('Members API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyToken(request)
    if (!authResult.success || !authResult.data) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { organizationId, role } = authResult.data

    // Check if user has permission to add members (admin or manager)
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions to add members' } },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validation = MemberCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid member data',
            details: validation.error.issues
          } 
        },
        { status: 400 }
      )
    }

    // Create member
    const schemaName = DatabaseService.sanitizeSchemaName(organizationId)
    const memberRepo = new MemberRepository()
    const result = await memberRepo.create(schemaName, {
      ...validation.data,
      orgId: organizationId
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to create member' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    }, { status: 201 })

  } catch (error) {
    console.error('Create member API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}