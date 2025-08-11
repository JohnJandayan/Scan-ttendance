import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request from Vercel
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cleanupResults = {
      timestamp: new Date().toISOString(),
      tasks: [] as Array<{ task: string; status: string; details?: any }>,
    }

    // Task 1: Clean up expired sessions (if you have a sessions table)
    try {
      const expiredSessionsResult = await supabase
        .from('user_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())

      cleanupResults.tasks.push({
        task: 'expired_sessions_cleanup',
        status: 'completed',
        details: { deleted: expiredSessionsResult.count || 0 },
      })
    } catch (error) {
      cleanupResults.tasks.push({
        task: 'expired_sessions_cleanup',
        status: 'skipped',
        details: { reason: 'No sessions table found' },
      })
    }

    // Task 2: Clean up old audit logs (older than 90 days)
    try {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const auditLogsResult = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', ninetyDaysAgo.toISOString())

      cleanupResults.tasks.push({
        task: 'old_audit_logs_cleanup',
        status: 'completed',
        details: { deleted: auditLogsResult.count || 0 },
      })
    } catch (error) {
      cleanupResults.tasks.push({
        task: 'old_audit_logs_cleanup',
        status: 'failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    }

    // Task 3: Clean up orphaned verification records (events that no longer exist)
    try {
      // This would require custom logic based on your schema structure
      // For now, we'll just log that this task was considered
      cleanupResults.tasks.push({
        task: 'orphaned_records_cleanup',
        status: 'skipped',
        details: {
          reason: 'Manual review required for organization-specific schemas',
        },
      })
    } catch (error) {
      cleanupResults.tasks.push({
        task: 'orphaned_records_cleanup',
        status: 'failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    }

    // Task 4: Update statistics cache (if you have cached statistics)
    try {
      // This is a placeholder for any statistics caching you might implement
      cleanupResults.tasks.push({
        task: 'statistics_cache_refresh',
        status: 'skipped',
        details: { reason: 'Real-time statistics used, no cache to refresh' },
      })
    } catch (error) {
      cleanupResults.tasks.push({
        task: 'statistics_cache_refresh',
        status: 'failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    }

    // Log the cleanup results
    console.log('Cleanup cron job completed:', cleanupResults)

    return NextResponse.json({
      success: true,
      message: 'Cleanup tasks completed',
      results: cleanupResults,
    })
  } catch (error) {
    console.error('Cleanup cron job failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Prevent other HTTP methods
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
