'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Event } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import EventSettings from '@/components/events/EventSettings'
import EventPermissions from '@/components/events/EventPermissions'

export default function EventSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'permissions'>('general')

  const eventId = params.id as string

  useEffect(() => {
    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  const fetchEventData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/events/${eventId}`)
      const data = await response.json()

      if (data.success) {
        setEvent(data.data)
      } else {
        setError(data.error?.message || 'Failed to fetch event data')
      }
    } catch (err) {
      setError('Failed to fetch event data')
    } finally {
      setLoading(false)
    }
  }

  const handleEventUpdate = (updatedEvent: Event) => {
    setEvent(updatedEvent)
  }

  const handleBackToDashboard = () => {
    router.push(`/events/${eventId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchEventData}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Retry
            </button>
            <button
              onClick={handleBackToDashboard}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Back to Event
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Event not found</h3>
          <p className="mt-2 text-sm text-gray-500">The requested event could not be found.</p>
          <button
            onClick={handleBackToDashboard}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={handleBackToDashboard}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Settings</h1>
              <p className="text-sm text-gray-600">{event.name}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              event.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {event.isActive ? 'Active' : 'Archived'}
            </span>
            {event.endedAt && (
              <span className="text-xs text-gray-500">
                Ended on {new Date(event.endedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General Settings
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'permissions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permissions
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'general' && (
            <div className="p-6">
              <div className="space-y-6">
                {/* Event Metadata Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Event Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Name
                      </label>
                      <input
                        type="text"
                        value={event.name}
                        readOnly
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Use the modal settings to edit the event name
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Created Date
                      </label>
                      <input
                        type="text"
                        value={new Date(event.createdAt).toLocaleString()}
                        readOnly
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Actions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Event Actions</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Open Settings Modal</h4>
                        <p className="text-sm text-gray-500">
                          Access advanced settings including archiving, deletion, and metadata editing
                        </p>
                      </div>
                      <EventSettings
                        event={event}
                        onEventUpdate={handleEventUpdate}
                        onClose={() => {}}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="p-6">
              <EventPermissions
                event={event}
                organizationId={user?.organizationId || ''}
                currentUserRole={user?.role || 'viewer'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}