import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Check database connectivity
    const { error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
      .single()

    const dbResponseTime = Date.now() - startTime

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Database check failed: ${error.message}`)
    }

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET'
    ]

    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    )

    if (missingEnvVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`)
    }

    // System information
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: process.env.NODE_ENV
      },
      version: process.env.npm_package_version || '1.0.0'
    }

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV
      }
    }

    return NextResponse.json(errorData, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}