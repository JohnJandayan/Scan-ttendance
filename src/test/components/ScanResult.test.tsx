import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import ScanResult from '@/components/events/ScanResult'

describe('ScanResult', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not render when result is null', () => {
    render(<ScanResult result={null} onClose={mockOnClose} />)
    
    expect(screen.queryByText('Scan Successful')).not.toBeInTheDocument()
    expect(screen.queryByText('Scan Failed')).not.toBeInTheDocument()
  })

  it('should render successful scan result', () => {
    const successResult = {
      success: true,
      message: 'Attendance verified successfully!',
      participantName: 'John Doe',
      participantId: 'ID123',
      timestamp: '2024-01-15T10:30:00Z'
    }

    render(<ScanResult result={successResult} onClose={mockOnClose} />)
    
    expect(screen.getByText('Scan Successful')).toBeInTheDocument()
    expect(screen.getByText('Attendance verified successfully!')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('ID123')).toBeInTheDocument()
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('should render failed scan result', () => {
    const failResult = {
      success: false,
      message: 'Participant not found in attendance list',
      participantId: 'INVALID123'
    }

    render(<ScanResult result={failResult} onClose={mockOnClose} />)
    
    expect(screen.getByText('Scan Failed')).toBeInTheDocument()
    expect(screen.getByText('Participant not found in attendance list')).toBeInTheDocument()
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('should show correct icons for success and failure', () => {
    const successResult = {
      success: true,
      message: 'Success message'
    }

    const { rerender } = render(<ScanResult result={successResult} onClose={mockOnClose} />)
    
    // Check for success styling
    expect(screen.getByText('Scan Successful')).toHaveClass('text-green-800')

    const failResult = {
      success: false,
      message: 'Error message'
    }

    rerender(<ScanResult result={failResult} onClose={mockOnClose} />)
    
    // Check for error styling
    expect(screen.getByText('Scan Failed')).toHaveClass('text-red-800')
  })

  it('should handle continue button click', () => {
    const result = {
      success: true,
      message: 'Test message'
    }

    render(<ScanResult result={result} onClose={mockOnClose} />)
    
    fireEvent.click(screen.getByText('Continue'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should auto-close after specified delay', async () => {
    const result = {
      success: true,
      message: 'Test message'
    }

    render(<ScanResult result={result} onClose={mockOnClose} autoCloseDelay={2000} />)
    
    // Fast-forward time
    vi.advanceTimersByTime(2000)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should show auto-close countdown', () => {
    const result = {
      success: true,
      message: 'Test message'
    }

    render(<ScanResult result={result} onClose={mockOnClose} autoCloseDelay={3000} />)
    
    expect(screen.getByText(/This dialog will close automatically in 3 seconds/)).toBeInTheDocument()
  })

  it('should not auto-close when autoCloseDelay is 0', () => {
    const result = {
      success: true,
      message: 'Test message'
    }

    render(<ScanResult result={result} onClose={mockOnClose} autoCloseDelay={0} />)
    
    // Fast-forward time
    vi.advanceTimersByTime(5000)
    
    expect(mockOnClose).not.toHaveBeenCalled()
    expect(screen.queryByText(/This dialog will close automatically/)).not.toBeInTheDocument()
  })

  it('should display participant details when provided', () => {
    const result = {
      success: true,
      message: 'Verified successfully',
      participantName: 'Jane Smith',
      participantId: 'JS456',
      timestamp: '2024-01-15T14:45:30Z'
    }

    render(<ScanResult result={result} onClose={mockOnClose} />)
    
    expect(screen.getByText('Name:')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('ID:')).toBeInTheDocument()
    expect(screen.getByText('JS456')).toBeInTheDocument()
    expect(screen.getByText('Time:')).toBeInTheDocument()
    
    // Check that timestamp is formatted
    const timestampElement = screen.getByText(/1\/15\/2024/)
    expect(timestampElement).toBeInTheDocument()
  })

  it('should not show participant details for failed scans', () => {
    const result = {
      success: false,
      message: 'Scan failed',
      participantId: 'INVALID'
    }

    render(<ScanResult result={result} onClose={mockOnClose} />)
    
    expect(screen.queryByText('Name:')).not.toBeInTheDocument()
    expect(screen.queryByText('ID:')).not.toBeInTheDocument()
    expect(screen.queryByText('Time:')).not.toBeInTheDocument()
  })

  it('should apply correct styling for success state', () => {
    const result = {
      success: true,
      message: 'Success message'
    }

    render(<ScanResult result={result} onClose={mockOnClose} />)
    
    const dialog = screen.getByText('Success message').closest('div')
    expect(dialog).toHaveClass('border-green-500')
    
    const button = screen.getByText('Continue')
    expect(button).toHaveClass('bg-green-600')
  })

  it('should apply correct styling for failure state', () => {
    const result = {
      success: false,
      message: 'Error message'
    }

    render(<ScanResult result={result} onClose={mockOnClose} />)
    
    const dialog = screen.getByText('Error message').closest('div')
    expect(dialog).toHaveClass('border-red-500')
    
    const button = screen.getByText('Continue')
    expect(button).toHaveClass('bg-red-600')
  })

  it('should cleanup timer on unmount', () => {
    const result = {
      success: true,
      message: 'Test message'
    }

    const { unmount } = render(<ScanResult result={result} onClose={mockOnClose} autoCloseDelay={3000} />)
    
    unmount()
    
    // Fast-forward time after unmount
    vi.advanceTimersByTime(3000)
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should handle result change and reset timer', () => {
    const result1 = {
      success: true,
      message: 'First message'
    }

    const { rerender } = render(<ScanResult result={result1} onClose={mockOnClose} autoCloseDelay={3000} />)
    
    // Advance time partially
    vi.advanceTimersByTime(1000)
    
    const result2 = {
      success: false,
      message: 'Second message'
    }

    rerender(<ScanResult result={result2} onClose={mockOnClose} autoCloseDelay={3000} />)
    
    // Advance time by remaining amount from original timer
    vi.advanceTimersByTime(2000)
    
    // Should not have closed yet because timer was reset
    expect(mockOnClose).not.toHaveBeenCalled()
    
    // Advance by full new timer duration
    vi.advanceTimersByTime(3000)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})