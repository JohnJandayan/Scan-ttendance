'use client'

import { useState, useEffect } from 'react'
import { Event } from '@/types'

interface ArchivedEventsListProps {
  organizationId: string
}

interface EventStats {
  totalAttendees: number
  verifiedAttendees: number
  verificationRate: number
}

export default function ArchivedEventsList({ organizationId }: ArchivedEventsListProps) {
  const [archivedEvents, setArchivedEvents] = useState<Event[]>([])
  const [eventStats, setEventStats] = useState<Record<string, EventStats>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'endedAt' | 'createdAt' | 'name'>('endedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadArchivedEvents()
  }, [organizationId])

  const loadArchivedEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/events?status=archived')
      const data = await response.json()

      if (data.success) {
        const events = data.data || []
        setArchivedEvents(events)
        
        // Load stats for each event
        const statsPromises = events.map(async (event: Event) => {
          try {
            const statsResponse = await fetch(`/api/events/${event.id}/stats`)
            const statsData = await statsResponse.json()
            return { eventId: event.id, stats: statsData.success ? statsData.data : null }
          } catch {
            return { eventId: event.id, stats: null }
          }
        })

        const statsResults = await Promise.all(statsPromises)
        const statsMap = statsResults.reduce((acc, { eventId, stats }) => {
          if (stats) {
            acc[eventId] = stats
          }
          return acc
        }, {} as Record<string, EventStats>)

        setEventStats(statsMap)
      } else {
        setError(data.error?.message || 'Failed to load archived events')
      }
    } catch (err) {
      setError('Failed to load archived events')
    } finally {
      setLoading(false)
    }
  }

  const handleReactivateEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to reactivate this event?')) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/archive`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        // Remove from archived events list
        setArchivedEvents(prev => prev.filter(event => event.id !== eventId))
        alert('Event reactivated successfully')
      } else {
        alert(data.error?.message || 'Failed to reactivate event')
      }
    } catch (err) {
      alert('Failed to reactivate event')
    }
  }

  const handleViewEvent = (eventId: string) => {
    window.location.href = `/events/${eventId}`
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateDuration = (createdAt: Date | string, endedAt: Date | string) => {
    const start = new Date(createdAt)
    const end = new Date(endedAt)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`
    } else if (diffHours > 0) {
      return `${diffHours}h`
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return `${diffMinutes}m`
    }
  }

  // Filter and sort events
  const filteredAndSortedEvents = archivedEvents
    .filter(event => 
      event.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: string | Date
      let bValue: string | Date

      switch (sortBy) {
        case 'endedAt':
          aValue = a.endedAt || a.createdAt
          bValue = b.endedAt || b.createdAt
          break
        case 'createdAt':
          aValue = a.createdAt
          bValue = b.createdAt
          break
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        default:
          aValue = a.endedAt || a.createdAt
          bValue = b.endedAt || b.createdAt
      }

      if (sortBy === 'name') {
        const comparison = (aValue as string).localeCompare(bValue as string)
        return sortOrder === 'asc' ? comparison : -comparison
      } else {
        const aTime = new Date(aValue).getTime()
        const bTime = new Date(bValue).getTime()
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime
      }
    })

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading archived events...</span>
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
            <div className="mt-4">
              <button
                onClick={loadArchivedEvents}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Archived Events</h2>
          <p className="text-sm text-gray-600">
            {archivedEvents.length} archived event{archivedEvents.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'endedAt' | 'createdAt' | 'name')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="endedAt">Sort by End Date</option>
              <option value="createdAt">Sort by Created Date</option>
              <option value="name">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <svg className={`h-4 w-4 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      {filteredAndSortedEvents.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'No events found' : 'No archived events'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'Completed events will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredAndSortedEvents.map((event) => {
              const stats = eventStats[event.id]
              return (
                <li key={event.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.name}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Created: {formatDate(event.createdAt)}</span>
                            {event.endedAt && (
                              <>
                                <span>•</span>
                                <span>Ended: {formatDate(event.endedAt)}</span>
                                <span>•</span>
                                <span>Duration: {calculateDuration(event.createdAt, event.endedAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    {stats && (
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{stats.totalAttendees}</div>
                          <div className="text-xs">Expected</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">{stats.verifiedAttendees}</div>
                          <div className="text-xs">Verified</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">{stats.verificationRate}%</div>
                          <div className="text-xs">Rate</div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-6">
                      <button
                        onClick={() => handleViewEvent(event.id)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                      <button
                        onClick={() => handleReactivateEvent(event.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reactivate
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}