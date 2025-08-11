'use client'

import { useState, useEffect, useCallback } from 'react'
import { VerificationRecord } from '@/types'
import { useRealtime } from '@/hooks/useRealtime'
import { useAuth } from '@/contexts/AuthContext'

interface ScanHistoryProps {
  eventId: string
  verificationTableName?: string
  limit?: number
  enableRealtime?: boolean
  showTitle?: boolean
}

export default function ScanHistory({ 
  eventId, 
  verificationTableName = '',
  limit = 10,
  enableRealtime = true,
  showTitle = true
}: ScanHistoryProps) {
  const { getSchemaName } = useAuth()
  const [recentScans, setRecentScans] = useState<VerificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle real-time verification updates
  const handleVerificationUpdate = useCallback((newVerification: VerificationRecord) => {
    setRecentScans(prev => {
      // Add new verification to the beginning and keep only the limit
      const updated = [newVerification, ...prev]
      return updated.slice(0, limit)
    })
  }, [limit])

  // Set up real-time subscription
  const schemaName = getSchemaName()
  const { isConnected: realtimeConnected } = useRealtime({
    eventId,
    schemaName: schemaName || '',
    verificationTableName,
    enabled: enableRealtime && !!schemaName && !!verificationTableName,
    onVerificationUpdate: handleVerificationUpdate
  })

  useEffect(() => {
    fetchRecentScans()
  }, [eventId, limit])

  const fetchRecentScans = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/verifications?limit=${limit}&page=1`)
      const data = await response.json()

      if (data.success) {
        setRecentScans(data.data?.data || [])
      } else {
        setError(data.error?.message || 'Failed to fetch recent scans')
      }
    } catch (err) {
      setError('Failed to fetch recent scans')
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date()
    const scanTime = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - scanTime.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else {
      return scanTime.toLocaleDateString()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800'
      case 'duplicate':
        return 'bg-yellow-100 text-yellow-800'
      case 'invalid':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'duplicate':
        return (
          <svg className="h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'invalid':
        return (
          <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
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

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Scans</h3>
              {enableRealtime && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  realtimeConnected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-1 ${
                    realtimeConnected ? 'bg-green-400' : 'bg-gray-400'
                  }`}></span>
                  {realtimeConnected ? 'Live' : 'Offline'}
                </span>
              )}
            </div>
            <button
              onClick={fetchRecentScans}
              className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8" role="status">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
          </div>
        ) : recentScans.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recent scans</h3>
            <p className="mt-1 text-sm text-gray-500">QR code scans will appear here in real-time.</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-my-3 divide-y divide-gray-200">
              {recentScans.map((scan, index) => (
                <li key={scan.id} className="py-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        scan.status === 'verified' ? 'bg-green-100' :
                        scan.status === 'duplicate' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {getStatusIcon(scan.status)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {scan.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        ID: {scan.participantId}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scan.status)}`}>
                        {scan.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(scan.verifiedAt)}
                      </p>
                    </div>
                    {index === 0 && realtimeConnected && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}