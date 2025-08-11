'use client'

import { useState, useEffect, useCallback } from 'react'
import { Event, VerificationRecord } from '@/types'
import { useRealtime } from '@/hooks/useRealtime'
import { useAuth } from '@/contexts/AuthContext'
import EventSettings from './EventSettings'

interface EventStats {
  totalAttendees: number
  verifiedAttendees: number
  verificationRate: number
}

interface EventDashboardProps {
  eventId: string
}

export default function EventDashboard({ eventId }: EventDashboardProps) {
  const { getSchemaName } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [stats, setStats] = useState<EventStats | null>(null)
  const [verifications, setVerifications] = useState<VerificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  // Handle real-time verification updates
  const handleVerificationUpdate = useCallback((newVerification: VerificationRecord) => {
    setVerifications(prev => {
      // Add new verification to the beginning of the list
      const updated = [newVerification, ...prev]
      // Keep only the latest 10 verifications for the dashboard
      return updated.slice(0, 10)
    })
  }, [])

  // Handle real-time stats updates
  const handleStatsUpdate = useCallback((newStats: EventStats) => {
    setStats(newStats)
  }, [])

  // Optimistic update for immediate feedback
  const _addOptimisticVerification = useCallback((verification: Partial<VerificationRecord>) => {
    const optimisticVerification: VerificationRecord = {
      id: `temp_${Date.now()}`,
      name: verification.name || 'Unknown',
      participantId: verification.participantId || '',
      status: verification.status || 'verified',
      verifiedAt: new Date()
    }

    setVerifications(prev => [optimisticVerification, ...prev.slice(0, 9)])
    
    // Update stats optimistically
    if (verification.status === 'verified') {
      setStats(prev => prev ? {
        ...prev,
        verifiedAttendees: prev.verifiedAttendees + 1,
        verificationRate: Math.round(((prev.verifiedAttendees + 1) / prev.totalAttendees) * 100)
      } : null)
    }
  }, [])

  // Handle real-time errors
  const handleRealtimeError = useCallback((err: Error) => {
    console.error('Real-time error:', err)
    setRealtimeConnected(false)
  }, [])

  // Set up real-time subscription
  const schemaName = getSchemaName()
  const {
    isConnected: realtimeIsConnected,
    error: _realtimeError,
    reconnect: reconnectRealtime
  } = useRealtime({
    eventId,
    schemaName: schemaName || '',
    verificationTableName: event?.verificationTableName || '',
    enabled: !!event && event.isActive && !!schemaName,
    onVerificationUpdate: handleVerificationUpdate,
    onStatsUpdate: handleStatsUpdate,
    onError: handleRealtimeError
  })

  // Update realtime connection status
  useEffect(() => {
    setRealtimeConnected(realtimeIsConnected)
  }, [realtimeIsConnected])

  const fetchEventData = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      const data = await response.json()

      if (data.success) {
        setEvent(data.data)
      } else {
        if (!hasError) {
          setError(data.error?.message || 'Failed to fetch event data')
          setHasError(true)
        }
      }
    } catch (err) {
      if (!hasError) {
        setError('Failed to fetch event data')
        setHasError(true)
      }
    }
  }, [eventId, hasError])

  const fetchEventStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/stats`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      } else {
        if (!hasError) {
          setError(data.error?.message || 'Failed to fetch event statistics')
          setHasError(true)
        }
      }
    } catch (err) {
      if (!hasError) {
        setError('Failed to fetch event statistics')
        setHasError(true)
      }
    }
  }, [eventId, hasError])

  const fetchVerifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/verifications?limit=10`)
      const data = await response.json()

      if (data.success) {
        setVerifications(data.data?.data || [])
      } else {
        if (!hasError) {
          setError(data.error?.message || 'Failed to fetch verification records')
          setHasError(true)
        }
      }
    } catch (err) {
      if (!hasError) {
        setError('Failed to fetch verification records')
        setHasError(true)
      }
    } finally {
      setLoading(false)
    }
  }, [eventId, hasError])

  // Refresh data function for external use
  const refreshData = useCallback(() => {
    fetchEventStats()
    fetchVerifications()
  }, [fetchEventStats, fetchVerifications])

  useEffect(() => {
    fetchEventData()
    fetchEventStats()
    fetchVerifications()
  }, [eventId, fetchEventData, fetchEventStats, fetchVerifications])

  const handleEventUpdate = (updatedEvent: Event) => {
    setEvent(updatedEvent)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Event not found</h3>
        <p className="mt-2 text-sm text-gray-500">The requested event could not be found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Created on {formatDate(event.createdAt)}
                {event.endedAt && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Archived on {formatDate(event.endedAt)}
                  </span>
                )}
                {event.isActive && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
                {event.isActive && (
                  <span 
                    className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                      realtimeConnected 
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                    onClick={() => !realtimeConnected && reconnectRealtime()}
                    title={realtimeConnected ? 'Real-time updates active' : 'Click to reconnect'}
                  >
                    <span className={`w-2 h-2 rounded-full mr-1 ${
                      realtimeConnected ? 'bg-blue-400' : 'bg-yellow-400'
                    }`}></span>
                    {realtimeConnected ? 'Live Updates' : 'Reconnect'}
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              {event.isActive ? (
                <button
                  onClick={() => window.location.href = `/events/${eventId}/scan`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                  </svg>
                  Scan QR Codes
                </button>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-200 cursor-not-allowed"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                  </svg>
                  Event Archived
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Settings Modal */}
      {showSettings && event && (
        <EventSettings
          event={event}
          onEventUpdate={handleEventUpdate}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Attendees</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.totalAttendees || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Verified Attendees</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.verifiedAttendees || 0}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Verification Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats?.verificationRate || 0}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Verifications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Check-ins</h3>
            <button
              onClick={() => window.location.href = `/events/${eventId}/verifications`}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all →
            </button>
          </div>
          
          {verifications.length === 0 ? (
            <div className="text-center py-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No check-ins yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start scanning QR codes to see attendance records here.</p>
            </div>
          ) : (
            <div className="flow-root">
              <ul className="-my-5 divide-y divide-gray-200">
                {verifications.map((verification) => (
                  <li key={verification.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          verification.status === 'verified' ? 'bg-green-100' :
                          verification.status === 'duplicate' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {verification.status === 'verified' ? (
                            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : verification.status === 'duplicate' ? (
                            <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {verification.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          ID: {verification.participantId}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-sm text-gray-500">
                        {formatDate(verification.verifiedAt)}
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          verification.status === 'verified' ? 'bg-green-100 text-green-800' :
                          verification.status === 'duplicate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {verification.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}