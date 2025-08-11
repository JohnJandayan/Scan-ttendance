'use client'

import React from 'react'
import { getRecoveryStrategy, getErrorMessage, getErrorCode } from '@/lib/error-handling'

interface ErrorDisplayProps {
  error: Error | null
  onRetry?: () => void
  onGoBack?: () => void
  canRetry?: boolean
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ErrorDisplay({
  error,
  onRetry,
  onGoBack,
  canRetry = false,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  className = '',
  size = 'md'
}: ErrorDisplayProps) {
  if (!error) return null

  const errorMessage = getErrorMessage(error)
  const errorCode = getErrorCode(error)
  const recoveryStrategy = getRecoveryStrategy(error)

  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg ${sizeClasses[size]} ${className}`}>
      <div className="flex items-start gap-3">
        <svg className={`${iconSizes[size]} text-red-500 flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-red-800 mb-1">
            Error Occurred
          </h3>
          
          <p className="text-red-700 mb-3">
            {errorMessage}
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details className="mb-3">
              <summary className="cursor-pointer text-xs text-red-600 mb-1">
                Technical Details
              </summary>
              <div className="text-xs text-red-600 bg-red-100 p-2 rounded font-mono">
                <div>Code: {errorCode}</div>
                {retryCount > 0 && (
                  <div>Retry Count: {retryCount}/{maxRetries}</div>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-wrap gap-2">
            {canRetry && onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRetrying ? (
                  <>
                    <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retrying...
                  </>
                ) : (
                  <>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                    {retryCount > 0 && ` (${retryCount}/${maxRetries})`}
                  </>
                )}
              </button>
            )}

            {recoveryStrategy.action === 'goBack' && onGoBack && (
              <button
                onClick={onGoBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
            )}

            {recoveryStrategy.action === 'wait' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 text-sm rounded-md">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Please wait and try again
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline error component for forms
export function InlineError({ 
  error, 
  className = '' 
}: { 
  error: string | null
  className?: string 
}) {
  if (!error) return null

  return (
    <div className={`flex items-center gap-1.5 text-red-600 text-sm mt-1 ${className}`}>
      <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span>{error}</span>
    </div>
  )
}

export default ErrorDisplay