'use client'

import { useState, useEffect, useCallback } from 'react'
import { VerificationRecord } from '@/types'
import { useRealtime } from '@/hooks/useRealtime'
import { useAuth } from '@/contexts/AuthContext'

interface AttendanceListProps {
  eventId: string
  showSearch?: boolean
  limit?: number
  verificationTableName?: string
  enableRealtime?: boolean
}

export default function AttendanceList({ 
  eventId, 
  showSearch = true, 
  limit, 
  verificationTableName = '',
  enableRealtime = true 
}: AttendanceListProps) {
  const { getSchemaName } = useAuth()
  const [verifications, setVerifications] = useState<VerificationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'time' | 'status'>('time')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Handle real-time verification updates
  const handleVerificationUpdate = useCallback((newVerification: VerificationRecord) => {
    setVerifications(prev => {
      // Check if verification already exists (avoid duplicates)
      const exists = prev.some(v => v.id === newVerification.id)
      if (exists) return prev
      
      // Add new verification to the beginning of the list
      return [newVerification, ...prev]
    })
  }, [])

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
    fetchVerifications()
  }, [eventId, page])

  const fetchVerifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        ...(limit && { limit: limit.toString() })
      })
      
      const response = await fetch(`/api/events/${eventId}/verifications?${params}`)
      const data = await response.json()

      if (data.success) {
        if (page === 1) {
          setVerifications(data.data?.data || [])
        } else {
          setVerifications(prev => [...prev, ...(data.data?.data || [])])
        }
        setHasMore(data.data?.hasMore || false)
      } else {
        setError(data.error?.message || 'Failed to fetch verification records')
      }
    } catch (err) {
      setError('Failed to fetch verification records')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
    }
  }

  const filteredAndSortedVerifications = verifications
    .filter(verification => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        verification.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.participantId.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || verification.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'time':
          comparison = new Date(a.verifiedAt).getTime() - new Date(b.verifiedAt).getTime()
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        default:
          comparison = 0
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString()
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

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Attendance Records</h3>
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
          <div className="text-sm text-gray-500">
            {filteredAndSortedVerifications.length} record{filteredAndSortedVerifications.length !== 1 ? 's' : ''}
          </div>
        </div>

        {showSearch && (
          <div className="mb-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters and Sorting */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="invalid">Invalid</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'time' | 'status')}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="time">Check-in Time</option>
                  <option value="name">Name</option>
                  <option value="status">Status</option>
                </select>
              </div>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {sortOrder === 'asc' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  )}
                </svg>
              </button>

              {/* Clear Filters */}
              {(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {loading && page === 1 ? (
          <div className="flex justify-center items-center py-8" role="status">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
          </div>
        ) : filteredAndSortedVerifications.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No records match your search criteria.' : 'No one has checked in yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participant ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Check-in Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedVerifications.map((verification) => (
                    <tr key={verification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100">
                            {getStatusIcon(verification.status)}
                          </div>
                          <div className="ml-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(verification.status)}`}>
                              {verification.status}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{verification.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">{verification.participantId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(verification.verifiedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasMore && !limit && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}