import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AuditLogEntry {
  id?: string
  userId?: string
  organizationId?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp?: string
  success: boolean
  errorMessage?: string
}

export type AuditAction = 
  | 'auth.login'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.failed_login'
  | 'org.create'
  | 'org.update'
  | 'member.create'
  | 'member.update'
  | 'member.delete'
  | 'event.create'
  | 'event.update'
  | 'event.archive'
  | 'event.delete'
  | 'attendee.add'
  | 'attendee.import'
  | 'scan.verify'
  | 'scan.failed'
  | 'data.export'
  | 'settings.update'
  | 'security.rate_limit'
  | 'security.invalid_input'
  | 'security.suspicious_activity'

export class AuditLogger {
  private static instance: AuditLogger
  private logQueue: AuditLogEntry[] = []
  private isProcessing = false
  
  private constructor() {
    // Process log queue every 5 seconds
    setInterval(() => {
      this.processQueue()
    }, 5000)
  }
  
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }
  
  public async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    }
    
    // Add to queue for batch processing
    this.logQueue.push(logEntry)
    
    // If queue is getting large, process immediately
    if (this.logQueue.length >= 10) {
      await this.processQueue()
    }
  }
  
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      return
    }
    
    this.isProcessing = true
    const entries = [...this.logQueue]
    this.logQueue = []
    
    try {
      // Insert audit logs into database
      const { error } = await supabase
        .from('audit_logs')
        .insert(entries)
      
      if (error) {
        console.error('Failed to insert audit logs:', error)
        // Re-add failed entries to queue
        this.logQueue.unshift(...entries)
      }
    } catch (error) {
      console.error('Error processing audit log queue:', error)
      // Re-add failed entries to queue
      this.logQueue.unshift(...entries)
    } finally {
      this.isProcessing = false
    }
  }
  
  // Convenience methods for common audit events
  public async logAuth(
    action: 'login' | 'logout' | 'register' | 'failed_login',
    userId?: string,
    organizationId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action: `auth.${action}` as AuditAction,
      resource: 'authentication',
      details,
      ipAddress,
      userAgent,
      success,
      errorMessage
    })
  }
  
  public async logOrganization(
    action: 'create' | 'update',
    organizationId: string,
    userId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action: `org.${action}` as AuditAction,
      resource: 'organization',
      resourceId: organizationId,
      details,
      ipAddress,
      userAgent,
      success,
      errorMessage
    })
  }
  
  public async logMember(
    action: 'create' | 'update' | 'delete',
    memberId: string,
    organizationId: string,
    userId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action: `member.${action}` as AuditAction,
      resource: 'member',
      resourceId: memberId,
      details,
      ipAddress,
      userAgent,
      success,
      errorMessage
    })
  }
  
  public async logEvent(
    action: 'create' | 'update' | 'archive' | 'delete',
    eventId: string,
    organizationId: string,
    userId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action: `event.${action}` as AuditAction,
      resource: 'event',
      resourceId: eventId,
      details,
      ipAddress,
      userAgent,
      success,
      errorMessage
    })
  }
  
  public async logScan(
    action: 'verify' | 'failed',
    eventId: string,
    organizationId: string,
    userId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action: `scan.${action}` as AuditAction,
      resource: 'scan',
      resourceId: eventId,
      details,
      ipAddress,
      userAgent,
      success,
      errorMessage
    })
  }
  
  public async logSecurity(
    action: 'rate_limit' | 'invalid_input' | 'suspicious_activity',
    resource: string,
    resourceId?: string,
    userId?: string,
    organizationId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      organizationId,
      action: `security.${action}` as AuditAction,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      success: false,
      errorMessage
    })
  }
  
  // Query audit logs
  public async getAuditLogs(
    organizationId?: string,
    userId?: string,
    action?: AuditAction,
    resource?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (organizationId) {
      query = query.eq('organizationId', organizationId)
    }
    
    if (userId) {
      query = query.eq('userId', userId)
    }
    
    if (action) {
      query = query.eq('action', action)
    }
    
    if (resource) {
      query = query.eq('resource', resource)
    }
    
    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString())
    }
    
    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString())
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching audit logs:', error)
      return []
    }
    
    return data || []
  }
  
  // Get audit log statistics
  public async getAuditStats(
    organizationId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEvents: number
    successfulEvents: number
    failedEvents: number
    actionBreakdown: Record<string, number>
    resourceBreakdown: Record<string, number>
  }> {
    let query = supabase
      .from('audit_logs')
      .select('action, resource, success')
    
    if (organizationId) {
      query = query.eq('organizationId', organizationId)
    }
    
    if (startDate) {
      query = query.gte('timestamp', startDate.toISOString())
    }
    
    if (endDate) {
      query = query.lte('timestamp', endDate.toISOString())
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching audit stats:', error)
      return {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        actionBreakdown: {},
        resourceBreakdown: {}
      }
    }
    
    const logs = data || []
    const actionBreakdown: Record<string, number> = {}
    const resourceBreakdown: Record<string, number> = {}
    let successfulEvents = 0
    let failedEvents = 0
    
    logs.forEach(log => {
      // Count actions
      actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1
      
      // Count resources
      resourceBreakdown[log.resource] = (resourceBreakdown[log.resource] || 0) + 1
      
      // Count success/failure
      if (log.success) {
        successfulEvents++
      } else {
        failedEvents++
      }
    })
    
    return {
      totalEvents: logs.length,
      successfulEvents,
      failedEvents,
      actionBreakdown,
      resourceBreakdown
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance()

// Helper function to extract request metadata
export function getRequestMetadata(request: Request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  }
}