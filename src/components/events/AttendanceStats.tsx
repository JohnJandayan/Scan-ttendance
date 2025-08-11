'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRealtime } from '@/hooks/useRealtime'
import { useAuth } from '@/contexts/AuthContext'

interface AttendanceStatsProps {
  eventId: string
  verificationTableName?: string
  enableRealtime?: boolean
}

interface StatsData {
  totalAttendees: number
  verifiedAttendees: number
  duplicateScans: number
  invalidScans: number
  verificationRate: number
  hourlyBreakdown: { hour: string; count: number }[]
  statusBreakdown: { status: string; count: number; percentage: number }[]
}

export default function AttendanceStats({ 
  eventId, 
  verificationTableName = '',
  enableRealtime = true 
}: AttendanceStatsProps) {
  const { getSchemaName } = useAuth()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle real-time stats updates
  const handleStatsUpdate = useCallback((newStats: any) => {
    setStats(prevStats => ({
      ...prevStats,
      ...newStats
    }))
  }, [])

  // Set up real-time subscription
  const schemaName = getSchemaName()
  const { isConnected: realtimeConnected } = useRealtime({
    eventId,
    schemaName: schemaName || '',
    verificationTableName,
    enabled: enableRealtime && !!schemaName && !!verificationTableName,
    onStatsUpdate: handleStatsUpdate
  })

  useEffect(() => {
    fetchStats()
  }, [eventId])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${eventId}/stats`)
      const data = await response.json()

      if (data.success) {
        // Enhance basic stats with additional calculations
        const basicStats = data.data
        const enhancedStats = await calculateEnhancedStats(basicStats)
        setStats(enhancedStats)
      } else {
        setError(data.error?.message || 'Failed to fetch statistics')
      }
    } catch (err) {
      setError('Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  const calculateEnhancedStats = async (basicStats: any): Promise<StatsData> => {
    try {
      // Fetch detailed verification records for enhanced analytics
      const response = await fetch(`/api/events/${eventId}/verifications?limit=1000&page=1`)
      const data = await response.json()
      
      const records = data.success ? (data.data?.data || []) : []
      
      // Calculate status breakdown
      const statusCounts = records.reduce((acc: any, record: any) => {
        acc[record.status] = (acc[record.status] || 0) + 1
        return acc
      }, {})

      const totalRecords = records.length
      const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count: count as number,
        percentage: totalRecords > 0 ? Math.round(((count as number) / totalRecords) * 100) : 0
      }))

      // Calculate hourly breakdown
      const hourlyBreakdown = calculateHourlyBreakdown(records)

      return {
        totalAttendees: basicStats.totalAttendees || 0,
        verifiedAttendees: basicStats.verifiedAttendees || 0,
        duplicateScans: statusCounts.duplicate || 0,
        invalidScans: statusCounts.invalid || 0,
        verificationRate: basicStats.verificationRate || 0,
        hourlyBreakdown,
        statusBreakdown
      }
    } catch (error) {
      console.error('Failed to calculate enhanced stats:', error)
      return {
        totalAttendees: basicStats.totalAttendees || 0,
        verifiedAttendees: basicStats.verifiedAttendees || 0,
        duplicateScans: 0,
        invalidScans: 0,
        verificationRate: basicStats.verificationRate || 0,
        hourlyBreakdown: [],
        statusBreakdown: []
      }
    }
  }

  const calculateHourlyBreakdown = (records: any[]) => {
    const hourCounts: { [key: string]: number } = {}
    
    records.forEach(record => {
      const hour = new Date(record.verifiedAt).getHours()
      const hourKey = `${hour.toString().padStart(2, '0')}:00`
      hourCounts[hourKey] = (hourCounts[hourKey] || 0) + 1
    })

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600'
      case 'duplicate':
        return 'text-yellow-600'
      case 'invalid':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'duplicate':
        return (
          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'invalid':
        return (
          <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
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

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-center items-center py-8" role="status">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                  <dd className="text-lg font-medium text-gray-900">{stats.totalAttendees}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Verified</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.verifiedAttendees}</dd>
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
                  <dd className="text-lg font-medium text-gray-900">{stats.verificationRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
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
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Scans</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.verifiedAttendees + stats.duplicateScans + stats.invalidScans}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Status Breakdown</h3>
          <div className="space-y-3">
            {stats.statusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.status)}
                  <span className={`text-sm font-medium capitalize ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-900">{item.count}</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.status === 'verified' ? 'bg-green-500' :
                        item.status === 'duplicate' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-10 text-right">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Breakdown */}
      {stats.hourlyBreakdown.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Check-in Activity by Hour</h3>
            <div className="space-y-2">
              {stats.hourlyBreakdown.map((item) => {
                const maxCount = Math.max(...stats.hourlyBreakdown.map(h => h.count))
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                
                return (
                  <div key={item.hour} className="flex items-center space-x-3">
                    <span className="text-sm font-mono text-gray-600 w-12">{item.hour}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div 
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                        {item.count}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}