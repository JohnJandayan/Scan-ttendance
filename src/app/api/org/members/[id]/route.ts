import { NextRequest, NextResponse } from 'next/server'
import { MemberRepository } from '@/lib/repositories'
import { verifyToken } from '@/lib/auth'
import { MemberCreateSchema } from '@/types'

export async function PUT(
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

    const { organizationId, role } = authResult.data
    const resolvedParams = await params
    const memberId = resolvedParams.id

    // Check if user has permission to update members (admin or manager)
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions to update members' } },
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

    // Update member
    const memberRepo = new MemberRepository()
    
    // For now, we'll use a placeholder schema name
    // This will be properly implemented when we have the organization-schema mapping
    const schemaName = `org_${organizationId}`
    
    const result = await memberRepo.update(schemaName, memberId, validation.data)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to update member' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Update member API error:', error)
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
    const authResult = await verifyToken(request)
    if (!authResult.success || !authResult.data) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { organizationId, role } = authResult.data
    const resolvedParams = await params
    const memberId = resolvedParams.id

    // Check if user has permission to delete members (admin or manager)
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions to delete members' } },
        { status: 403 }
      )
    }

    // Delete member
    const memberRepo = new MemberRepository()
    
    // For now, we'll use a placeholder schema name
    // This will be properly implemented when we have the organization-schema mapping
    const schemaName = `org_${organizationId}`
    
    const result = await memberRepo.delete(schemaName, memberId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to delete member' } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true }
    })

  } catch (error) {
    console.error('Delete member API error:', error)
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
    const memberId = resolvedParams.id

    // Get member
    const memberRepo = new MemberRepository()
    
    // For now, we'll use a placeholder schema name
    // This will be properly implemented when we have the organization-schema mapping
    const schemaName = `org_${organizationId}`
    
    const result = await memberRepo.findById(schemaName, memberId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: result.error || 'Failed to get member' } },
        { status: 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Get member API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}