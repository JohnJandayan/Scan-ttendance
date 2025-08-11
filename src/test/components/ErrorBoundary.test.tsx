import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'

// Mock fetch for error logging
global.fetch = vi.fn()

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try Again/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Go Home/ })).toBeInTheDocument()
  })

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  it('should retry when Try Again button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Try Again/ }))

    // After retry, render the same component but without error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('should navigate to home when Go Home button is clicked', () => {
    // Mock window.location.href
    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: /Go Home/ }))

    expect(mockLocation.href).toBe('/')
  })

  it('should log error to API endpoint', () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValue(new Response('{}', { status: 200 }))

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(mockFetch).toHaveBeenCalledWith('/api/errors/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: expect.stringContaining('Test error')
    })
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('should handle fetch error when logging fails', () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockRejectedValue(new Error('Network error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(consoleSpy).toHaveBeenCalledWith('Failed to log error:', expect.any(Error))
  })
})