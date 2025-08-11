'use client'

import React, { useEffect } from 'react'

interface ScanResultProps {
  result: {
    success: boolean
    message: string
    participantName?: string
    participantId?: string
    timestamp?: string
  } | null
  onClose: () => void
  autoCloseDelay?: number
}

export default function ScanResult({ result, onClose, autoCloseDelay = 3000 }: ScanResultProps) {
  useEffect(() => {
    if (result && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    }
  }, [result, onClose, autoCloseDelay])

  if (!result) {
    return null
  }

  const { success, message, participantName, participantId, timestamp } = result

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 max-w-md mx-4 border-l-4 ${
        success ? 'border-green-500' : 'border-red-500'
      }`}>
        {/* Status Icon */}
        <div className="flex items-center mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
            success ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {success ? (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h3 className={`text-lg font-semibold ${
            success ? 'text-green-800' : 'text-red-800'
          }`}>
            {success ? 'Scan Successful' : 'Scan Failed'}
          </h3>
        </div>

        {/* Message */}
        <p className="text-gray-700 mb-4">{message}</p>

        {/* Participant Details (if successful) */}
        {success && participantName && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <span className="ml-2 text-gray-900">{participantName}</span>
              </div>
              {participantId && (
                <div>
                  <span className="text-sm font-medium text-gray-600">ID:</span>
                  <span className="ml-2 text-gray-900 font-mono text-sm">{participantId}</span>
                </div>
              )}
              {timestamp && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Time:</span>
                  <span className="ml-2 text-gray-900">{new Date(timestamp).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded font-medium ${
              success 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            Continue
          </button>
        </div>

        {/* Auto-close indicator */}
        {autoCloseDelay > 0 && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            This dialog will close automatically in {Math.ceil(autoCloseDelay / 1000)} seconds
          </div>
        )}
      </div>
    </div>
  )
}