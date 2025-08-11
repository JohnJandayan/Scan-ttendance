'use client'

import { useState, useRef } from 'react'
import { CSVAttendee, EventCreate } from '@/types'
import { parseCSV, validateCSVFile, readFileAsText, CSVParseResult } from '@/lib/csv-utils'

interface EventCreationProps {
  organizationId: string
  onEventCreated?: (eventId: string) => void
  onCancel?: () => void
}

interface ManualAttendee {
  name: string
  participantId: string
  tempId: string
}

export default function EventCreation({ 
  organizationId, 
  onEventCreated, 
  onCancel 
}: EventCreationProps) {
  const [eventName, setEventName] = useState('')
  const [attendees, setAttendees] = useState<CSVAttendee[]>([])
  const [manualAttendees, setManualAttendees] = useState<ManualAttendee[]>([])
  const [inputMethod, setInputMethod] = useState<'manual' | 'csv'>('manual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [csvParseResult, setCsvParseResult] = useState<CSVParseResult | null>(null)
  
  // Manual entry form state
  const [newName, setNewName] = useState('')
  const [newId, setNewId] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleEventNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEventName(e.target.value)
    setError(null)
  }

  const handleAddManualAttendee = () => {
    if (!newName.trim() || !newId.trim()) {
      setError('Both name and ID are required')
      return
    }

    // Check for duplicate IDs
    const existingIds = [
      ...manualAttendees.map(a => a.participantId),
      ...attendees.map(a => a.participantId)
    ]
    
    if (existingIds.includes(newId.trim())) {
      setError('Participant ID already exists')
      return
    }

    const newAttendee: ManualAttendee = {
      name: newName.trim(),
      participantId: newId.trim(),
      tempId: Date.now().toString()
    }

    setManualAttendees(prev => [...prev, newAttendee])
    setNewName('')
    setNewId('')
    setError(null)
  }

  const handleRemoveManualAttendee = (tempId: string) => {
    setManualAttendees(prev => prev.filter(a => a.tempId !== tempId))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setCsvErrors([])
    setCsvParseResult(null)

    try {
      // Validate file
      const fileValidation = validateCSVFile(file)
      if (!fileValidation.success) {
        setError(fileValidation.errors?.[0] || 'Invalid file')
        return
      }

      // Read and parse CSV
      const content = await readFileAsText(file)
      const parseResult = parseCSV(content)
      
      setCsvParseResult(parseResult)

      if (parseResult.success && parseResult.data) {
        // Check for conflicts with manual entries
        const manualIds = manualAttendees.map(a => a.participantId)
        const conflicts = parseResult.data.filter(a => 
          manualIds.includes(a.participantId)
        )

        if (conflicts.length > 0) {
          setError(`CSV contains IDs that conflict with manual entries: ${conflicts.map(c => c.participantId).join(', ')}`)
          return
        }

        setAttendees(parseResult.data)
        setCsvErrors([])
      } else {
        setCsvErrors(parseResult.errors || ['Failed to parse CSV'])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setLoading(false)
    }
  }

  const handleClearCSV = () => {
    setAttendees([])
    setCsvErrors([])
    setCsvParseResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!eventName.trim()) {
      setError('Event name is required')
      return
    }

    const allAttendees = [
      ...attendees,
      ...manualAttendees.map(({ tempId, ...attendee }) => attendee)
    ]

    if (allAttendees.length === 0) {
      setError('At least one attendee is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create event
      const eventData: EventCreate = {
        name: eventName.trim(),
        creatorId: organizationId // This should be the actual user ID, not org ID
      }

      const eventResponse = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })

      if (!eventResponse.ok) {
        const errorData = await eventResponse.json()
        throw new Error(errorData.error?.message || 'Failed to create event')
      }

      const eventResult = await eventResponse.json()
      
      if (!eventResult.success) {
        throw new Error(eventResult.error?.message || 'Failed to create event')
      }

      const eventId = eventResult.data.id

      // Add attendees
      const attendeesResponse = await fetch(`/api/events/${eventId}/attendees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ attendees: allAttendees })
      })

      if (!attendeesResponse.ok) {
        const errorData = await attendeesResponse.json()
        throw new Error(errorData.error?.message || 'Failed to add attendees')
      }

      const attendeesResult = await attendeesResponse.json()
      
      if (!attendeesResult.success) {
        throw new Error(attendeesResult.error?.message || 'Failed to add attendees')
      }

      // Success - call callback
      onEventCreated?.(eventId)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const totalAttendees = attendees.length + manualAttendees.length

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
          <p className="mt-1 text-sm text-gray-600">
            Set up a new event and add attendees for QR code verification
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Event Name */}
          <div>
            <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-2">
              Event Name *
            </label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={handleEventNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter event name"
              required
            />
          </div>

          {/* Input Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you like to add attendees? *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inputMethod"
                  value="manual"
                  checked={inputMethod === 'manual'}
                  onChange={(e) => setInputMethod(e.target.value as 'manual' | 'csv')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Manual Entry</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="inputMethod"
                  value="csv"
                  checked={inputMethod === 'csv'}
                  onChange={(e) => setInputMethod(e.target.value as 'manual' | 'csv')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">CSV Import</span>
              </label>
            </div>
          </div>

          {/* Manual Entry */}
          {inputMethod === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-1">
                    Attendee Name
                  </label>
                  <input
                    type="text"
                    id="newName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label htmlFor="newId" className="block text-sm font-medium text-gray-700 mb-1">
                    Participant ID
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="newId"
                      value={newId}
                      onChange={(e) => setNewId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter ID"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualAttendee}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual Attendees List */}
              {manualAttendees.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Added Attendees ({manualAttendees.length})
                  </h4>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {manualAttendees.map((attendee) => (
                          <tr key={attendee.tempId}>
                            <td className="px-4 py-2 text-sm text-gray-900">{attendee.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{attendee.participantId}</td>
                            <td className="px-4 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveManualAttendee(attendee.tempId)}
                                className="text-red-600 hover:text-red-900 text-sm"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CSV Import */}
          {inputMethod === 'csv' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {attendees.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCSV}
                      className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  CSV should have columns: Name, Participant ID (max 5MB)
                </p>
              </div>

              {/* CSV Parse Results */}
              {csvParseResult && (
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Import Results</h4>
                    <span className={`text-sm ${csvParseResult.success ? 'text-green-600' : 'text-red-600'}`}>
                      {csvParseResult.success ? '✓ Success' : '⚠ Errors Found'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Total rows: {csvParseResult.totalRows}</p>
                    <p>Valid rows: {csvParseResult.validRows}</p>
                    {csvParseResult.success && (
                      <p className="text-green-600">Successfully imported {attendees.length} attendees</p>
                    )}
                  </div>
                </div>
              )}

              {/* CSV Errors */}
              {csvErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Import Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {csvErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CSV Preview */}
              {attendees.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Imported Attendees ({attendees.length})
                  </h4>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {attendees.slice(0, 10).map((attendee, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{attendee.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{attendee.participantId}</td>
                          </tr>
                        ))}
                        {attendees.length > 10 && (
                          <tr>
                            <td colSpan={2} className="px-4 py-2 text-sm text-gray-500 text-center">
                              ... and {attendees.length - 10} more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
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

          {/* Summary */}
          {totalAttendees > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    Ready to create event with {totalAttendees} attendee{totalAttendees !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !eventName.trim() || totalAttendees === 0}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}