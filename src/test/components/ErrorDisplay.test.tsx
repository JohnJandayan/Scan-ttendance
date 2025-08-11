import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorDisplay, InlineError } from '@/components/error/ErrorDisplay'
import { ClientError } from '@/lib/error-handling'

describe('ErrorDisplay', () => {
  it('should not render when error is null', () => {
    const { container } = render(<ErrorDisplay error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render error message', () => {
    const error = new Error('Test error message')
    
    render(<ErrorDisplay error={error} />)
    
    expect(screen.getByText('Error Occurred')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('should show retry button when canRetry is true', () => {
    const error = new Error('Test error')
    const onRetry = vi.fn()
    
    render(<ErrorDisplay error={error} canRetry={true} onRetry={onRetry} />)
    
    const retryButton = screen.getByRole('button', { name: /Try Again/ })
    expect(retryButton).toBeInTheDocument()
    
    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('should disable retry button when isRetrying is true', () => {
    const error = new Error('Test error')
    const onRetry = vi.fn()
    
    render(
      <ErrorDisplay 
        error={error} 
        canRetry={true} 
        onRetry={onRetry} 
        isRetrying={true} 
      />
    )
    
    const retryButton = screen.getByRole('button', { name: /Retrying.../ })
    expect(retryButton).toBeDisabled()
  })

  it('should show retry count when provided', () => {
    const error = new Error('Test error')
    const onRetry = vi.fn()
    
    render(
      <ErrorDisplay 
        error={error} 
        canRetry={true} 
        onRetry={onRetry} 
        retryCount={2}
        maxRetries={3}
      />
    )
    
    expect(screen.getByText(/Try Again \(2\/3\)/)).toBeInTheDocument()
  })

  it('should show go back button for authorization errors', () => {
    const error = new ClientError('Forbidden', 'AUTHORIZATION_ERROR', 403)
    const onGoBack = vi.fn()
    
    render(<ErrorDisplay error={error} onGoBack={onGoBack} />)
    
    const goBackButton = screen.getByRole('button', { name: /Go Back/ })
    expect(goBackButton).toBeInTheDocument()
    
    fireEvent.click(goBackButton)
    expect(onGoBack).toHaveBeenCalledTimes(1)
  })

  it('should show wait message for rate limit errors', () => {
    const error = new ClientError('Rate limited', 'RATE_LIMIT_EXCEEDED', 429)
    
    render(<ErrorDisplay error={error} />)
    
    expect(screen.getByText('Please wait and try again')).toBeInTheDocument()
  })

  it('should show technical details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    
    const error = new ClientError('Test error', 'TEST_ERROR', 400)
    
    render(<ErrorDisplay error={error} retryCount={1} maxRetries={3} />)
    
    expect(screen.getByText('Technical Details')).toBeInTheDocument()
    
    // Click to expand details
    fireEvent.click(screen.getByText('Technical Details'))
    
    expect(screen.getByText('Code: TEST_ERROR')).toBeInTheDocument()
    expect(screen.getByText('Retry Count: 1/3')).toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('should not show technical details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    
    const error = new ClientError('Test error', 'TEST_ERROR', 400)
    
    render(<ErrorDisplay error={error} />)
    
    expect(screen.queryByText('Technical Details')).not.toBeInTheDocument()
    
    process.env.NODE_ENV = originalEnv
  })

  it('should apply size classes correctly', () => {
    const error = new Error('Test error')
    
    const { rerender } = render(<ErrorDisplay error={error} size="sm" />)
    expect(screen.getByText('Error Occurred').closest('div')).toHaveClass('p-3', 'text-sm')
    
    rerender(<ErrorDisplay error={error} size="lg" />)
    expect(screen.getByText('Error Occurred').closest('div')).toHaveClass('p-6', 'text-lg')
  })

  it('should apply custom className', () => {
    const error = new Error('Test error')
    
    render(<ErrorDisplay error={error} className="custom-class" />)
    
    expect(screen.getByText('Error Occurred').closest('div')).toHaveClass('custom-class')
  })
})

describe('InlineError', () => {
  it('should not render when error is null', () => {
    const { container } = render(<InlineError error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render error message with icon', () => {
    render(<InlineError error="Field is required" />)
    
    expect(screen.getByText('Field is required')).toBeInTheDocument()
    // Check for alert triangle icon (by looking for svg element)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<InlineError error="Test error" className="custom-inline-class" />)
    
    expect(screen.getByText('Test error').closest('div')).toHaveClass('custom-inline-class')
  })
})