import { useState, useEffect, useCallback, useRef } from 'react'
import { RealtimeService } from '@/lib/realtime'
import { VerificationRecord } from '@/types'

interface RealtimeStats {
  totalAttendees: number
  verifiedAttendees: number
  verificationRate: number
}

interface UseRealtimeOptions {
  eventId: string
  schemaName: string
  verificationTableName: string
  enabled?: boolean
  onVerificationUpdate?: (verification: VerificationRecord) => void
  onStatsUpdate?: (stats: RealtimeStats) => void
  onError?: (error: Error) => void
}

interface UseRealtimeReturn {
  isConnected: boolean
  error: Error | null
  reconnect: () => void
  disconnect: () => void
  clearError: () => void
}

export function useRealtime(options: UseRealtimeOptions): UseRealtimeReturn {
  const {
    eventId,
    schemaName,
    verificationTableName,
    enabled = true,
    onVerificationUpdate,
    onStatsUpdate,
    onError
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((err: Error) => {
    setError(err)
    setIsConnected(false)
    onError?.(err)
    
    // Auto-reconnect after 5 seconds
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (enabled) {
        reconnect()
      }
    }, 5000)
  }, [enabled, onError])

  const connect = useCallback(() => {
    if (!enabled || !eventId || !schemaName || !verificationTableName) {
      return
    }

    try {
      // Clear any existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }

      // Create new subscription
      const unsubscribe = RealtimeService.subscribeToEventUpdates({
        eventId,
        schemaName,
        verificationTableName,
        onVerificationUpdate: (verification) => {
          setIsConnected(true)
          setError(null)
          onVerificationUpdate?.(verification)
        },
        onStatsUpdate: (stats) => {
          onStatsUpdate?.(stats)
        },
        onError: handleError
      })

      unsubscribeRef.current = unsubscribe
      
      // Set connected state after a brief delay to allow subscription to establish
      setTimeout(() => {
        if (unsubscribeRef.current) {
          setIsConnected(true)
          setError(null)
        }
      }, 1000)

    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to connect to real-time updates'))
    }
  }, [eventId, schemaName, verificationTableName, enabled, onVerificationUpdate, onStatsUpdate, handleError])

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
    setError(null)
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    setTimeout(connect, 100) // Brief delay before reconnecting
  }, [disconnect, connect])

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return disconnect
  }, [enabled, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    error,
    reconnect,
    disconnect,
    clearError
  }
}

// Hook for organization-level real-time updates
interface UseOrganizationRealtimeOptions {
  schemaName: string
  enabled?: boolean
  onEventUpdate?: (event: any) => void
  onError?: (error: Error) => void
}

interface UseOrganizationRealtimeReturn {
  isConnected: boolean
  error: Error | null
  reconnect: () => void
  disconnect: () => void
  clearError: () => void
}

export function useOrganizationRealtime(options: UseOrganizationRealtimeOptions): UseOrganizationRealtimeReturn {
  const {
    schemaName,
    enabled = true,
    onEventUpdate,
    onError
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((err: Error) => {
    setError(err)
    setIsConnected(false)
    onError?.(err)
    
    // Auto-reconnect after 5 seconds
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (enabled) {
        reconnect()
      }
    }, 5000)
  }, [enabled, onError])

  const connect = useCallback(() => {
    if (!enabled || !schemaName) {
      return
    }

    try {
      // Clear any existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }

      // Create new subscription
      const unsubscribe = RealtimeService.subscribeToOrganizationUpdates(
        schemaName,
        (event) => {
          setIsConnected(true)
          setError(null)
          onEventUpdate?.(event)
        },
        handleError
      )

      unsubscribeRef.current = unsubscribe
      
      // Set connected state after a brief delay
      setTimeout(() => {
        if (unsubscribeRef.current) {
          setIsConnected(true)
          setError(null)
        }
      }, 1000)

    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to connect to organization updates'))
    }
  }, [schemaName, enabled, onEventUpdate, handleError])

  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
    setError(null)
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    setTimeout(connect, 100)
  }, [disconnect, connect])

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    return disconnect
  }, [enabled, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    error,
    reconnect,
    disconnect,
    clearError
  }
}