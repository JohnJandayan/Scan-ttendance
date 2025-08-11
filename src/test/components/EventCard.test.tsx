import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EventCard from '@/components/dashboard/EventCard'
import { Event } from '@/types'

// Mock window.location
const mockLocation = {
  href: ''
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('EventCard', () => {
  const mockOngoingEvent: Event = {
    id: 'event-1',
    name: 'Test Event',
    creatorId: 'user-1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    isActive: true,
    attendanceTableName: 'test_event_attendance',
    verificationTableName: 'test_event_verification'
  }

  const mockArchivedEvent: Event = {
    id: 'event-2',
    name: 'Archived Event',
    creatorId: 'user-1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    endedAt: new Date('2024-01-02T15:30:00Z'),
    isActive: false,
    attendanceTableName: 'archived_event_attendance',
    verificationTableName: 'archived_event_verification'
  }

  beforeEach(() => {
    mockLocation.href = ''
  })

  it('renders ongoing event card correctly', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText(/Created:/)).toBeInTheDocument()
    expect(screen.getByText(/ID:/)).toBeInTheDocument()
  })

  it('renders archived event card correctly', () => {
    render(<EventCard event={mockArchivedEvent} type="archived" />)
    
    expect(screen.getByText('Archived Event')).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()
    expect(screen.getByText(/Created:/)).toBeInTheDocument()
    expect(screen.getByText(/Ended:/)).toBeInTheDocument()
    expect(screen.getByText(/ID:/)).toBeInTheDocument()
  })

  it('displays correct status colors for ongoing events', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    const statusBadge = screen.getByText('Active')
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('displays correct status colors for archived events', () => {
    render(<EventCard event={mockArchivedEvent} type="archived" />)
    
    const statusBadge = screen.getByText('Archived')
    expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('formats dates correctly', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    // Check that date is formatted (exact format may vary by locale)
    expect(screen.getByText(/Created: Jan 1, 2024/)).toBeInTheDocument()
  })

  it('shows ended date for archived events', () => {
    render(<EventCard event={mockArchivedEvent} type="archived" />)
    
    expect(screen.getByText(/Ended: Jan 2, 2024/)).toBeInTheDocument()
  })

  it('displays event ID truncated', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    // Should show first 8 characters of ID followed by ...
    expect(screen.getByText(/ID: event-1\.\.\./)).toBeInTheDocument()
  })

  it('shows statistics section with placeholder values', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    expect(screen.getByText('Expected')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    // Should show 0 for both since we don't have real data yet
    expect(screen.getAllByText('0')).toHaveLength(2)
  })

  it('shows View Details button for all events', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    expect(screen.getByText('View Details')).toBeInTheDocument()
  })

  it('shows Scan QR button only for ongoing events', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    expect(screen.getByText('Scan QR')).toBeInTheDocument()
  })

  it('does not show Scan QR button for archived events', () => {
    render(<EventCard event={mockArchivedEvent} type="archived" />)
    
    expect(screen.queryByText('Scan QR')).not.toBeInTheDocument()
  })

  it('navigates to event details when View Details is clicked', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    fireEvent.click(screen.getByText('View Details'))
    
    expect(mockLocation.href).toBe('/events/event-1')
  })

  it('navigates to event details when view icon is clicked', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    const viewButton = screen.getByTitle('View event details')
    fireEvent.click(viewButton)
    
    expect(mockLocation.href).toBe('/events/event-1')
  })

  it('navigates to QR scanner when Scan QR is clicked', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    fireEvent.click(screen.getByText('Scan QR'))
    
    expect(mockLocation.href).toBe('/events/event-1/scan')
  })

  it('shows loading state when Scan QR button is clicked', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    const scanButton = screen.getByText('Scan QR')
    fireEvent.click(scanButton)
    
    // Button should be disabled and show loading spinner
    expect(scanButton).toBeDisabled()
  })

  it('truncates long event names', () => {
    const longNameEvent: Event = {
      ...mockOngoingEvent,
      name: 'This is a very long event name that should be truncated to prevent layout issues'
    }
    
    render(<EventCard event={longNameEvent} type="ongoing" />)
    
    const eventName = screen.getByText(longNameEvent.name)
    expect(eventName).toHaveClass('truncate')
  })

  it('handles events without ended date', () => {
    const eventWithoutEndDate: Event = {
      ...mockOngoingEvent,
      endedAt: undefined
    }
    
    render(<EventCard event={eventWithoutEndDate} type="ongoing" />)
    
    expect(screen.queryByText(/Ended:/)).not.toBeInTheDocument()
  })

  it('applies hover effects', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    const card = screen.getByText('Test Event').closest('div')
    expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow')
  })

  it('shows correct button styles for different states', () => {
    render(<EventCard event={mockOngoingEvent} type="ongoing" />)
    
    const viewButton = screen.getByText('View Details')
    const scanButton = screen.getByText('Scan QR')
    
    expect(viewButton).toHaveClass('bg-gray-100', 'hover:bg-gray-200', 'text-gray-700')
    expect(scanButton).toHaveClass('bg-indigo-600', 'hover:bg-indigo-700', 'text-white')
  })
})