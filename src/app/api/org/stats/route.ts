import { NextRequest, NextResponse } from 'next/server'
import { EventRepository, MemberRepository, AttendanceRepository } from '@/lib/repositories'
import { verifyToken } from '@/lib/auth'

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

    // Get statistics from different repositories
    const eventRepo = new EventRepository()
    const memberRepo = new MemberRepository()

    const [eventsResult, membersResult] = await Promise.all([
      eventRepo.findByOrganization(organizationId),
      memberRepo.findByOrganization(organizationId)
    ])

    if (!eventsResult.success || !membersResult.success) {
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch statistics' } },
        { status: 500 }
      )
    }

    const events = eventsResult.data || []
    const members = membersResult.data || []

    // Calculate statistics
    const activeEvents = events.filter(event => event.isActive).length
    const archivedEvents = events.filter(event => !event.isActive).length
    const totalMembers = members.length

    // For now, set these to 0 as we don't have attendance data yet
    // These will be implemented in later tasks
    const recentScans = 0
    const totalAttendance = 0

    const stats = {
      activeEvents,
      archivedEvents,
      totalMembers,
      recentScans,
      totalAttendance
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}