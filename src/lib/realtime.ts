import { createClient, RealtimeChannel } from '@supabase/supabase-js'
import { VerificationRecord } from '@/types'

interface RealtimeSubscriptionOptions {
  eventId: string
  schemaName: string
  verificationTableName: string
  onVerificationUpdate?: (verification: VerificationRecord) => void
  onStatsUpdate?: (stats: { totalAttendees: number; verifiedAttendees: number; verificationRate: number }) => void
  onError?: (error: Error) => void
}

interface RealtimeStats {
  totalAttendees: number
  verifiedAttendees: number
  verificationRate: number
}

export class RealtimeService {
  private static supabaseClient: ReturnType<typeof createClient> | null = null
  private static subscriptions: Map<string, RealtimeChannel> = new Map()

  private static getSupabaseClient() {
    if (!this.supabaseClient) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase configuration for real-time')
      }

      this.supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    }

    return this.supabaseClient
  }

  /**
   * Subscribe to real-time updates for an event's verification records
   */
  static subscribeToEventUpdates(options: RealtimeSubscriptionOptions): () => void {
    const {
      eventId,
      schemaName,
      verificationTableName,
      onVerificationUpdate,
      onStatsUpdate,
      onError
    } = options

    try {
      const supabase = this.getSupabaseClient()
      const subscriptionKey = `event_${eventId}`

      // Remove existing subscription if it exists
      this.unsubscribe(subscriptionKey)

      // Create new subscription
      const channel = supabase
        .channel(`event_updates_${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: schemaName,
            table: verificationTableName
          },
          async (payload) => {
            try {
              if (payload.eventType === 'INSERT' && payload.new) {
                // Handle new verification record
                const newVerification: VerificationRecord = {
                  id: payload.new.id,
                  name: payload.new.name,
                  participantId: payload.new.participant_id,
                  status: payload.new.status,
                  verifiedAt: new Date(payload.new.verified_at)
                }

                onVerificationUpdate?.(newVerification)

                // Fetch updated stats
                if (onStatsUpdate) {
                  const stats = await this.fetchEventStats(eventId)
                  if (stats) {
                    onStatsUpdate(stats)
                  }
                }
              }
            } catch (error) {
              onError?.(error instanceof Error ? error : new Error('Unknown error in real-time update'))
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Real-time subscription active for event ${eventId}`)
          } else if (status === 'CHANNEL_ERROR') {
            onError?.(new Error('Real-time subscription error'))
          } else if (status === 'TIMED_OUT') {
            onError?.(new Error('Real-time subscription timed out'))
          }
        })

      // Store subscription for cleanup
      this.subscriptions.set(subscriptionKey, channel)

      // Return unsubscribe function
      return () => this.unsubscribe(subscriptionKey)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to create real-time subscription'))
      return () => {} // Return no-op function
    }
  }

  /**
   * Subscribe to real-time updates for organization dashboard
   */
  static subscribeToOrganizationUpdates(
    schemaName: string,
    onEventUpdate?: (event: any) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      const supabase = this.getSupabaseClient()
      const subscriptionKey = `org_${schemaName}`

      // Remove existing subscription if it exists
      this.unsubscribe(subscriptionKey)

      // Create new subscription for events table
      const channel = supabase
        .channel(`org_updates_${schemaName}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: schemaName,
            table: 'events'
          },
          (payload) => {
            try {
              if (payload.new) {
                const newData = payload.new as any
                const eventData = {
                  id: newData.id,
                  name: newData.name,
                  creatorId: newData.creator_id,
                  createdAt: new Date(newData.created_at),
                  endedAt: newData.ended_at ? new Date(newData.ended_at) : undefined,
                  isActive: newData.is_active,
                  attendanceTableName: newData.attendance_table_name,
                  verificationTableName: newData.verification_table_name
                }

                onEventUpdate?.(eventData)
              }
            } catch (error) {
              onError?.(error instanceof Error ? error : new Error('Unknown error in organization update'))
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Real-time subscription active for organization ${schemaName}`)
          } else if (status === 'CHANNEL_ERROR') {
            onError?.(new Error('Organization real-time subscription error'))
          }
        })

      this.subscriptions.set(subscriptionKey, channel)

      return () => this.unsubscribe(subscriptionKey)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to create organization subscription'))
      return () => {}
    }
  }

  /**
   * Fetch current event statistics
   */
  private static async fetchEventStats(eventId: string): Promise<RealtimeStats | null> {
    try {
      const response = await fetch(`/api/events/${eventId}/stats`)
      const data = await response.json()

      if (data.success) {
        return data.data
      }
      return null
    } catch (error) {
      console.error('Failed to fetch event stats:', error)
      return null
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  static unsubscribe(subscriptionKey: string): void {
    const subscription = this.subscriptions.get(subscriptionKey)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
      console.log(`Unsubscribed from ${subscriptionKey}`)
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  static unsubscribeAll(): void {
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe()
      console.log(`Unsubscribed from ${key}`)
    })
    this.subscriptions.clear()
  }

  /**
   * Get the status of a subscription
   */
  static getSubscriptionStatus(subscriptionKey: string): string | null {
    const subscription = this.subscriptions.get(subscriptionKey)
    return subscription ? 'active' : null
  }

  /**
   * Get all active subscription keys
   */
  static getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys())
  }
}

// Hook for React components to use real-time functionality
export interface UseRealtimeOptions {
  eventId: string
  enabled?: boolean
  onVerificationUpdate?: (verification: VerificationRecord) => void
  onStatsUpdate?: (stats: RealtimeStats) => void
  onError?: (error: Error) => void
}

export interface UseRealtimeReturn {
  isConnected: boolean
  error: Error | null
  reconnect: () => void
  disconnect: () => void
}

// This will be used by React components
export function useRealtime(options: UseRealtimeOptions): UseRealtimeReturn {
  // This is a placeholder - the actual hook implementation will be in the component updates
  return {
    isConnected: false,
    error: null,
    reconnect: () => {},
    disconnect: () => {}
  }
}