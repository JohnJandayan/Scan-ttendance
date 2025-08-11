import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { env, supabaseConfig } from './env-validation'

// Supabase client instances
let supabaseClient: SupabaseClient | null = null
let supabaseServiceClient: SupabaseClient | null = null

/**
 * Get the public Supabase client (with anon key)
 * This client is used for client-side operations and authentication
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
        global: {
          headers: {
            'X-Client-Info': 'scan-ttendance-web',
          },
        },
      }
    )
  }
  return supabaseClient
}

/**
 * Get the service role Supabase client (with service role key)
 * This client is used for server-side operations that bypass RLS
 * WARNING: Only use this on the server side!
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('Service role client should only be used on the server side')
  }
  
  if (!supabaseServiceClient) {
    supabaseServiceClient = createClient(
      supabaseConfig.url,
      supabaseConfig.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            'X-Client-Info': 'scan-ttendance-server',
          },
        },
      }
    )
  }
  return supabaseServiceClient
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean
  error?: string
  details?: any
}> {
  try {
    const client = getSupabaseClient()
    
    // Test basic connection
    const { data, error } = await client
      .from('organizations')
      .select('count')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return {
        success: false,
        error: `Database connection failed: ${error.message}`,
        details: error
      }
    }
    
    return {
      success: true,
      details: {
        connected: true,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

/**
 * Test service role connection (server-side only)
 */
export async function testSupabaseServiceConnection(): Promise<{
  success: boolean
  error?: string
  details?: any
}> {
  if (typeof window !== 'undefined') {
    return {
      success: false,
      error: 'Service role client should only be used on the server side'
    }
  }
  
  try {
    const client = getSupabaseServiceClient()
    
    // Test service role connection with a simple query
    const { data, error } = await client
      .from('organizations')
      .select('count')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      return {
        success: false,
        error: `Service role connection failed: ${error.message}`,
        details: error
      }
    }
    
    return {
      success: true,
      details: {
        connected: true,
        hasServiceRole: true,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }
  }
}

/**
 * Initialize database schema for a new organization
 * This function creates the organization-specific schema and tables
 */
export async function initializeOrganizationSchema(organizationName: string): Promise<{
  success: boolean
  error?: string
  schemaName?: string
}> {
  if (typeof window !== 'undefined') {
    return {
      success: false,
      error: 'Schema initialization should only be done on the server side'
    }
  }
  
  try {
    const client = getSupabaseServiceClient()
    const schemaName = `org_${organizationName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    
    // Create the organization-specific schema
    const { error: schemaError } = await client.rpc('create_organization_schema', {
      schema_name: schemaName
    })
    
    if (schemaError) {
      return {
        success: false,
        error: `Failed to create schema: ${schemaError.message}`
      }
    }
    
    return {
      success: true,
      schemaName
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create event-specific tables for attendance tracking
 */
export async function createEventTables(
  schemaName: string,
  eventName: string
): Promise<{
  success: boolean
  error?: string
  tables?: string[]
}> {
  if (typeof window !== 'undefined') {
    return {
      success: false,
      error: 'Table creation should only be done on the server side'
    }
  }
  
  try {
    const client = getSupabaseServiceClient()
    const sanitizedEventName = eventName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const attendanceTable = `${sanitizedEventName}_attendance`
    const verificationTable = `${sanitizedEventName}_verification`
    
    // Create attendance table
    const { error: attendanceError } = await client.rpc('create_event_tables', {
      schema_name: schemaName,
      event_name: sanitizedEventName
    })
    
    if (attendanceError) {
      return {
        success: false,
        error: `Failed to create event tables: ${attendanceError.message}`
      }
    }
    
    return {
      success: true,
      tables: [attendanceTable, verificationTable]
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get Supabase configuration for deployment
 */
export function getSupabaseDeploymentConfig() {
  return {
    url: supabaseConfig.url,
    anonKey: supabaseConfig.anonKey,
    hasServiceRole: !!supabaseConfig.serviceRoleKey,
    environment: env.NODE_ENV,
    realtime: {
      enabled: true,
      eventsPerSecond: 10
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
}

/**
 * Validate Supabase configuration for deployment
 */
export function validateSupabaseConfig(): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check required configuration
  if (!supabaseConfig.url) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  } else if (!supabaseConfig.url.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL')
  }
  
  if (!supabaseConfig.anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  } else if (supabaseConfig.anonKey.length < 100) {
    warnings.push('NEXT_PUBLIC_SUPABASE_ANON_KEY seems too short')
  }
  
  if (!supabaseConfig.serviceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required for server operations')
  } else if (supabaseConfig.serviceRoleKey.length < 100) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY seems too short')
  }
  
  // Check for development vs production
  if (env.NODE_ENV === 'production') {
    if (supabaseConfig.url.includes('localhost') || supabaseConfig.url.includes('127.0.0.1')) {
      errors.push('Production should not use localhost Supabase URL')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Performance optimization for Supabase queries
 */
export const supabaseQueryOptions = {
  // Standard pagination
  pagination: {
    defaultLimit: 50,
    maxLimit: 1000
  },
  
  // Query timeouts
  timeouts: {
    default: 10000, // 10 seconds
    longRunning: 30000, // 30 seconds
    realtime: 5000 // 5 seconds
  },
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000 // 1 second
  }
}

/**
 * Create optimized query with retry logic
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: { attempts?: number; delay?: number } = {}
): Promise<{ data: T | null; error: any }> {
  const { attempts = 3, delay = 1000 } = options
  
  for (let i = 0; i < attempts; i++) {
    try {
      const result = await queryFn()
      
      // If successful or it's a business logic error (not a network error), return
      if (!result.error || result.error.code?.startsWith('PGRST')) {
        return result
      }
      
      // If it's the last attempt, return the error
      if (i === attempts - 1) {
        return result
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    } catch (error) {
      // If it's the last attempt, throw the error
      if (i === attempts - 1) {
        return { data: null, error }
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
  
  return { data: null, error: new Error('Max retry attempts reached') }
}