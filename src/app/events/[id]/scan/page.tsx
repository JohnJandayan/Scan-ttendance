'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QRScanner from '@/components/events/QRScanner'
import ScanResult from '@/components/events/ScanResult'
import { Event } from '@/types'

interface ScanResult {
  success: boolean
  message: string
  participantName?: string
  participantId?: string
  timestamp?: string
}

export default function ScanPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEventData()
  }, [eventId])

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      const data = await response.json()

      if (data.success) {
        setEvent(data.data)
        if (!data.data.isActive) {
          setError('This event is archived and no longer accepting QR code scans.')
        }
      } else {
        setError(data.error?.message || 'Failed to fetch event data')
      }
    } catch (err) {
      setError('Failed to fetch event data')
    } finally {
      setLoading(false)
    }
  }

  const handleStartScanning = () => {
    if (!event?.isActive) {
      setError('Cannot scan QR codes for archived events')
      return
    }
    setIsScanning(true)
  }

  const handleStopScanning = () => {
    setIsScanning(false)
  }

  const handleScan = async (scannedId: string) => {
    try {
      // Stop scanning temporarily while processing
      setIsScanning(false)

      const response = await fetch(`/api/events/${eventId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId: scannedId }),
      })

      const data = await response.json()

      if (data.success) {
        setScanResult({
          success: true,
          message: data.message || 'Attendance verified successfully!',
          participantName: data.data?.name,
          participantId: scannedId,
          timestamp: new Date().toISOString(),
        })
      } else {
        setScanResult({
          success: false,
          message: data.error?.message || 'Verification failed',
          participantId: scannedId,
        })
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: 'Network error occurred while verifying attendance',
        participantId: scannedId,
      })
    }
  }

  const handleScanError = (errorMessage: string) => {
    setScanResult({
      success: false,
      message: errorMessage,
    })
    setIsScanning(false)
  }

  const handleCloseScanResult = () => {
    setScanResult(null)
    // Resume scanning after closing result
    if (event?.isActive) {
      setIsScanning(true)
    }
  }

  const handleBackToDashboard = () => {
    router.push(`/events/${eventId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <svg className="h-6 w-6 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Error</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBackToDashboard}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The requested event could not be found.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
              <p className="text-sm text-gray-600">{event.name}</p>
            </div>
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isScanning ? (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to Scan</h2>
              <p className="text-gray-600">
                Click the button below to start scanning QR codes for attendance verification.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleStartScanning}
                disabled={!event.isActive}
                className={`w-full px-6 py-3 rounded-lg font-medium ${
                  event.isActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {event.isActive ? 'Start Scanning' : 'Event Archived'}
              </button>

              {!event.isActive && (
                <p className="text-sm text-red-600">
                  This event is archived and no longer accepting QR code scans.
                </p>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Instructions</h3>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• Point your camera at the QR code</li>
                <li>• Keep the code within the scanning frame</li>
                <li>• Hold steady until the scan completes</li>
                <li>• Results will appear immediately</li>
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      {/* QR Scanner Component */}
      <QRScanner
        isActive={isScanning}
        onScan={handleScan}
        onError={handleScanError}
        onClose={handleStopScanning}
      />

      {/* Scan Result Component */}
      <ScanResult
        result={scanResult}
        onClose={handleCloseScanResult}
        autoCloseDelay={3000}
      />
    </div>
  )
}