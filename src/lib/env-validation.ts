import { z } from 'zod'
import { config } from 'dotenv'

// Load environment variables from .env files
config({ path: '.env.local' })
config({ path: '.env' })

// Environment schema validation
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // Database
  DATABASE_URL: z.string().url('Invalid database URL').optional(),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Security
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
  
  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Cron job security
  CRON_SECRET: z.string().min(32, 'Cron secret must be at least 32 characters').optional(),
  
  // Vercel specific
  VERCEL: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
})

// Environment validation function
export function validateEnvironment() {
  try {
    console.log('Validating environment variables...')
    const env = envSchema.parse(process.env)
    
    // Additional validation for production
    if (env.NODE_ENV === 'production') {
      // Ensure production-specific requirements
      if (!env.CORS_ORIGIN) {
        console.warn('⚠️  CORS_ORIGIN not set in production. This may cause CORS issues.')
      }
      
      if (!env.CRON_SECRET) {
        console.warn('⚠️  CRON_SECRET not set. Cron endpoints will be disabled.')
      }
      
      if (!env.SENTRY_DSN) {
        console.warn('⚠️  SENTRY_DSN not set. Error monitoring will be disabled.')
      }
    }
    
    return env
  } catch (error) {
    console.error('❌ Environment validation failed with error:', error)
    if (error instanceof z.ZodError) {
      console.error('Zod validation errors:')
      if (error.issues && Array.isArray(error.issues)) {
        error.issues.forEach((err) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`)
        })
      }
      
      // Provide helpful suggestions
      console.error('\n💡 Suggestions:')
      console.error('  1. Check your .env.local file exists and has all required variables')
      console.error('  2. Copy .env.local.example to .env.local if you haven\'t already')
      console.error('  3. Ensure all secrets are at least 32 characters long')
      console.error('  4. Verify your Supabase URL and keys are correct')
      
      process.exit(1)
    }
    
    console.error('❌ Environment validation failed with unexpected error:', error)
    process.exit(1)
  }
}

// Export validated environment
export const env = validateEnvironment()

// Environment utilities
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

// Supabase configuration
export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
}

// JWT configuration
export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
}

// Security configuration
export const securityConfig = {
  corsOrigin: env.CORS_ORIGIN || (isProduction ? undefined : 'http://localhost:3000'),
  rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
}

// Monitoring configuration
export const monitoringConfig = {
  sentryDsn: env.SENTRY_DSN,
  logLevel: env.LOG_LEVEL,
}

// Cron configuration
export const cronConfig = {
  secret: env.CRON_SECRET,
  enabled: !!env.CRON_SECRET,
}

// Vercel configuration
export const vercelConfig = {
  isVercel: !!env.VERCEL,
  url: env.VERCEL_URL,
  environment: env.VERCEL_ENV,
}

// Environment info for debugging
export function getEnvironmentInfo() {
  return {
    nodeEnv: env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    isVercel: vercelConfig.isVercel,
    vercelEnv: vercelConfig.environment,
    hasDatabase: !!env.DATABASE_URL,
    hasSentry: !!env.SENTRY_DSN,
    hasCronSecret: !!env.CRON_SECRET,
    corsOrigin: securityConfig.corsOrigin,
    logLevel: env.LOG_LEVEL,
  }
}

// Validate specific environment requirements
export function validateProductionRequirements() {
  if (!isProduction) return true
  
  const issues: string[] = []
  
  if (!env.CORS_ORIGIN) {
    issues.push('CORS_ORIGIN should be set in production')
  }
  
  if (!env.SENTRY_DSN) {
    issues.push('SENTRY_DSN should be set for error monitoring')
  }
  
  if (!env.CRON_SECRET) {
    issues.push('CRON_SECRET should be set for scheduled tasks')
  }
  
  if (env.JWT_SECRET.length < 64) {
    issues.push('JWT_SECRET should be at least 64 characters in production')
  }
  
  if (issues.length > 0) {
    console.warn('⚠️  Production environment issues:')
    issues.forEach(issue => console.warn(`  - ${issue}`))
    return false
  }
  
  return true
}

// Environment health check
export function checkEnvironmentHealth() {
  const info = getEnvironmentInfo()
  const isHealthy = validateProductionRequirements()
  
  return {
    healthy: isHealthy,
    environment: info,
    timestamp: new Date().toISOString(),
  }
}