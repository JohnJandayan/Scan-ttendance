'use client'

import { useState } from 'react'
import { Event } from '@/types'

interface EventSettingsProps {
  event: Event
  onEventUpdate: (updatedEvent: Event) => void
  onClose: () => void
}

interface EventMetadata {
  name: string
}

export default function EventSettings({ event, onEventUpdate, onClose }: EventSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingMetadata, setEditingMetadata] = useState(false)
  const [metadata, setMetadata] = useState<EventMetadata>({
    name: event.name
  })
  const [metadataError, setMetadataError] = useState<string | null>(null)

  const handleArchiveEvent = async () => {
    if (!confirm('Are you sure you want to archive this event? This will prevent further QR code scanning and mark the event as ended.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${event.id}/archive`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        onEventUpdate(data.data)
        alert('Event archived successfully')
      } else {
        setError(data.error?.message || 'Failed to archive event')
      }
    } catch (err) {
      setError('Failed to archive event')
    } finally {
      setLoading(false)
    }
  }

  const handleReactivateEvent = async () => {
    if (!confirm('Are you sure you want to reactivate this event? This will allow QR code scanning again.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${event.id}/archive`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        onEventUpdate(data.data)
        alert('Event reactivated successfully')
      } else {
        setError(data.error?.message || 'Failed to reactivate event')
      }
    } catch (err) {
      setError('Failed to reactivate event')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMetadata = async () => {
    if (!metadata.name.trim()) {
      setMetadataError('Event name is required')
      return
    }

    setLoading(true)
    setMetadataError(null)

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: metadata.name.trim()
        })
      })
      const data = await response.json()

      if (data.success) {
        onEventUpdate(data.data)
        setEditingMetadata(false)
        alert('Event updated successfully')
      } else {
        setMetadataError(data.error?.message || 'Failed to update event')
      }
    } catch (err) {
      setMetadataError('Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelMetadataEdit = () => {
    setMetadata({ name: event.name })
    setMetadataError(null)
    setEditingMetadata(false)
  }

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to permanently delete this event? This action cannot be undone and will remove all attendance data.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        alert('Event deleted successfully')
        // Redirect to dashboard
        window.location.href = '/dashboard'
      } else {
        setError(data.error?.message || 'Failed to delete event')
      }
    } catch (err) {
      setError('Failed to delete event')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Event Settings</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Event Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">Event Information</h4>
              <button
                onClick={() => setEditingMetadata(!editingMetadata)}
                className="text-xs text-blue-600 hover:text-blue-500"
              >
                {editingMetadata ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            {editingMetadata ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={metadata.name}
                    onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter event name"
                  />
                  {metadataError && (
                    <p className="mt-1 text-xs text-red-600">{metadataError}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateMetadata}
                    disabled={loading}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelMetadataEdit}
                    disabled={loading}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Name:</span> {event.name}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {formatDate(event.createdAt)}
                </div>
                {event.endedAt && (
                  <div>
                    <span className="font-medium">Ended:</span> {formatDate(event.endedAt)}
                  </div>
                )}
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {event.isActive ? 'Active' : 'Archived'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Event Lifecycle Controls */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Event Lifecycle</h4>
            <div className="space-y-3">
              {event.isActive ? (
                <div className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Archive Event</p>
                    <p className="text-xs text-yellow-600">
                      End the event and prevent further QR code scanning
                    </p>
                  </div>
                  <button
                    onClick={handleArchiveEvent}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    {loading ? 'Archiving...' : 'Archive'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
                  <div>
                    <p className="text-sm font-medium text-green-800">Reactivate Event</p>
                    <p className="text-xs text-green-600">
                      Make the event active again and allow QR code scanning
                    </p>
                  </div>
                  <button
                    onClick={handleReactivateEvent}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading ? 'Reactivating...' : 'Reactivate'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-red-900 mb-3">Danger Zone</h4>
            <div className="border border-red-200 rounded-lg bg-red-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Delete Event</p>
                  <p className="text-xs text-red-600">
                    Permanently delete this event and all its data
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Access Control Information */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Access Control</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Active events allow QR code scanning and real-time updates</p>
              <p>• Archived events are read-only and prevent new scans</p>
              <p>• Only organization admins can modify event settings</p>
              <p>• Event data is preserved when archived for reporting</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-60">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Delete Event</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you absolutely sure you want to delete "{event.name}"? This action cannot be undone and will permanently remove:
                </p>
                <ul className="mt-2 text-xs text-gray-600 text-left list-disc list-inside">
                  <li>All attendance records</li>
                  <li>All verification records</li>
                  <li>Event configuration</li>
                  <li>Associated database tables</li>
                </ul>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvent}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}