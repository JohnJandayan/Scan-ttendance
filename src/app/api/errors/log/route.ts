import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/middleware/error'

interface ErrorLogData {
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  userAgent: string
  url: string
  userId?: string
  organizationId?: string
}

async function logErrorHandler(request: NextRequest) {
  const errorData: ErrorLogData = await request.json()
  
  // Validate required fields
  if (!errorData.message || !errorData.timestamp) {
    return NextResponse.json(
      { success: false, error: 'Missing required error data' },
      { status: 400 }
    )
  }

  // Enhanced error log with additional context
  const enhancedErrorLog = {
    ...errorData,
    serverTimestamp: new Date().toISOString(),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    referer: request.headers.get('referer'),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || 'unknown'
  }

  // Log to console (in production, send to monitoring service)
  console.error('Client Error:', enhancedErrorLog)

  // In production, you would send this to your error monitoring service
  if (process.env.NODE_ENV === 'production') {
    try {
      // Example: Send to external monitoring service
      // await sendToMonitoringService(enhancedErrorLog)
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring service:', monitoringError)
    }
  }

  return NextResponse.json({ success: true })
}

export const POST = withErrorHandling(logErrorHandler)