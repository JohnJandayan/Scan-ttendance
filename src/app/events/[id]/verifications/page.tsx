'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import AttendanceList from '@/components/events/AttendanceList'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Event } from '@/types'

export default function EventVerificationsPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEventData()
  }, [eventId])

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      const data = await response.json()

      if (data.success) {
        setEvent(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch event data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <div>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      <span className="sr-only">Home</span>
                    </button>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <button
                      onClick={() => router.push(`/events/${eventId}`)}
                      className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {loading ? 'Loading...' : event?.name || 'Event'}
                    </button>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="ml-4 text-sm font-medium text-gray-500">Attendance Records</span>
                  </div>
                </li>
              </ol>
            </nav>
            
            <div className="mt-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {loading ? 'Loading...' : `${event?.name} - Attendance Records`}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                View all check-in records for this event
              </p>
            </div>
          </div>

          {/* Attendance List */}
          <AttendanceList eventId={eventId} showSearch={true} />
        </div>
      </div>
    </ProtectedRoute>
  )
}