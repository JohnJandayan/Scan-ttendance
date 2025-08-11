'use client'

import { Event } from '@/types'
import { useState } from 'react'

interface EventCardProps {
  event: Event
  type: 'ongoing' | 'archived'
}

export default function EventCard({ event, type }: EventCardProps) {
  const [loading, setLoading] = useState(false)

  const handleViewEvent = () => {
    window.location.href = `/events/${event.id}`
  }

  const handleScanQR = () => {
    window.location.href = `/events/${event.id}/scan`
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = () => {
    if (type === 'ongoing') {
      return 'bg-green-100 text-green-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusText = () => {
    if (type === 'ongoing') {
      return 'Active'
    }
    return 'Archived'
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
              {event.name}
            </h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <div className="ml-4">
            <button
              onClick={handleViewEvent}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="View event details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-4h8v4z" />
            </svg>
            Created: {formatDate(event.createdAt)}
          </div>
          
          {event.endedAt && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ended: {formatDate(event.endedAt)}
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            ID: {event.id.slice(0, 8)}...
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">0</div>
            <div className="text-xs text-gray-600">Expected</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-indigo-600">0</div>
            <div className="text-xs text-gray-600">Verified</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleViewEvent}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            View Details
          </button>
          
          {type === 'ongoing' && (
            <button
              onClick={handleScanQR}
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scan QR
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}