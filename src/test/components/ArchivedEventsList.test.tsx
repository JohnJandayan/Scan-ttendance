import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ArchivedEventsList from '@/components/events/ArchivedEventsList'
import { Event } from '@/types'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.confirm
const mockConfirm = vi.fn()
global.confirm = mockConfirm

// Mock window.alert
const mockAlert = vi.fn()
global.alert = mockAlert

// Mock window.location
const mockLocation = {
  href: ''
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('ArchivedEventsList', () => {
  const mockArchivedEvents: Event[] = [
    {
      id: 'event-1',
      name: 'First Archived Event',
      creatorId: 'creator-1',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      endedAt: new Date('2024-01-02T15:30:00Z'),
      isActive: false,
      attendanceTableName: 'first_archived_event_attendance',
      verificationTableName: 'first_archived_event_verification'
    },
    {
      id: 'event-2',
      name: 'Second Archived Event',
      creatorId: 'creator-2',
      createdAt: new Date('2024-01-03T09:00:00Z'),
      endedAt: new Date('2024-01-04T17:00:00Z'),
      isActive: false,
      attendanceTableName: 'second_archived_event_attendance',
      verificationTableName: 'second_archived_event_verification'
    }
  ]

  const mockEventStats = {
    'event-1': {
      totalAttendees: 50,
      verifiedAttendees: 45,
      verificationRate: 90
    },
    'event-2': {
      totalAttendees: 30,
      verifiedAttendees: 28,
      verificationRate: 93.33
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockConfirm.mockClear()
    mockAlert.mockClear()
    mockLocation.href = ''

    // Default mock for events API
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/events?status=archived')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: mockArchivedEvents
          })
        })
      }
      
      if (url.includes('/stats')) {
        const eventId = url.split('/')[3]
        const stats = mockEventStats[eventId as keyof typeof mockEventStats]
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: stats || { totalAttendees: 0, verifiedAttendees: 0, verificationRate: 0 }
          })
        })
      }

      return Promise.resolve({
        ok: false,
        json: async () => ({ success: false, error: { message: 'Not found' } })
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true, data: [] })
          }), 100)
        )
      )

      render(<ArchivedEventsList organizationId="test-org" />)

      expect(screen.getByText('Loading archived events...')).toBeInTheDocument()
    })

    it('should show error state when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load archived events')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('should retry loading when retry button is clicked', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load archived events')).toBeInTheDocument()
      })

      // Reset mock for successful retry
      mockFetch.mockClear()
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/events?status=archived')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: mockArchivedEvents })
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: {} })
        })
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('First Archived Event')).toBeInTheDocument()
      })
    })
  })

  describe('Event Display', () => {
    it('should display archived events list', async () => {
      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('First Archived Event')).toBeInTheDocument()
        expect(screen.getByText('Second Archived Event')).toBeInTheDocument()
      })

      expect(screen.getByText('2 archived events')).toBeInTheDocument()
    })

    it('should display event statistics', async () => {
      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        // Check stats for first event
        expect(screen.getByText('50')).toBeInTheDocument() // Total attendees
        expect(screen.getByText('45')).toBeInTheDocument() // Verified attendees
        expect(screen.getByText('90%')).toBeInTheDocument() // Verification rate

        // Check stats for second event
        expect(screen.getByText('30')).toBeInTheDocument() // Total attendees
        expect(screen.getByText('28')).toBeInTheDocument() // Verified attendees
        expect(screen.getByText('93.33%')).toBeInTheDocument() // Verification rate
      })
    })

    it('should display event dates and duration', async () => {
      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText(/Created: 1\/1\/2024/)).toBeInTheDocument()
        expect(screen.getByText(/Ended: 1\/2\/2024/)).toBeInTheDocument()
        expect(screen.getByText(/Duration: 1d/)).toBeInTheDocument()
      })
    })

    it('should show empty state when no archived events', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/events?status=archived')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: [] })
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: {} })
        })
      })

      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('No archived events')).toBeInTheDocument()
        expect(screen.getByText('Completed events will appear here.')).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should filter events by search term', async () => {
      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('First Archived Event')).toBeInTheDocument()
        expect(screen.getByText('Second Archived Event')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search events...')
      fireEvent.change(searchInput, { target: { value: 'First' } })

      await waitFor(() => {
        expect(screen.getByText('First Archived Event')).toBeInTheDocument()
        expect(screen.queryByText('Second Archived Event')).not.toBeInTheDocument()
      })
    })

    it('should show no results message when search has no matches', async () => {
      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('First Archived Event')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search events...')
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } })

      await waitFor(() => {
        expect(screen.getByText('No events found')).toBeInTheDocument()
        expect(screen.getByText('Try adjusting your search terms.')).toBeInTheDocument()
      })
    })
  })

  describe('Sorting', () => {
    it('should sort events by end date by default', async () => {
      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        const eventElements = screen.getAllByText(/Archived Event/)
        expect(eventElements[0]).toHaveTextContent('Second Archived Event') // More recent end date
        expect(eventElements[1]).toHaveTextContent('First Archived Event')
      })
    })

    it('should change sort order when sort button is clicked', async () => {
      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('Second Archived Event')).toBeInTheDocument()
      })

      const sortButton = screen.getByTitle(/Sort ascending/)
      fireEvent.click(sortButton)

      await waitFor(() => {
        const eventElements = screen.getAllByText(/Archived Event/)
        expect(eventElements[0]).toHaveTextContent('First Archived Event') // Earlier end date
        expect(eventElements[1]).toHaveTextContent('Second Archived Event')
      })
    })

    it('should sort by name when name option is selected', async () => {
      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('Second Archived Event')).toBeInTheDocument()
      })

      const sortSelect = screen.getByDisplayValue('Sort by End Date')
      fireEvent.change(sortSelect, { target: { value: 'name' } })

      await waitFor(() => {
        const eventElements = screen.getAllByText(/Archived Event/)
        expect(eventElements[0]).toHaveTextContent('First Archived Event') // Alphabetically first
        expect(eventElements[1]).toHaveTextContent('Second Archived Event')
      })
    })
  })

  describe('Event Actions', () => {
    it('should navigate to event details when view button is clicked', async () => {
      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('First Archived Event')).toBeInTheDocument()
      })

      const viewButtons = screen.getAllByRole('button', { name: /view/i })
      fireEvent.click(viewButtons[0])

      expect(mockLocation.href).toBe('/events/event-1')
    })

    it('should reactivate event when reactivate button is clicked and confirmed', async () => {
      mockConfirm.mockReturnValue(true)
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/archive') && options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: { ...mockArchivedEvents[0], isActive: true } })
          })
        }
        // Default behavior for other calls
        if (url.includes('/api/events?status=archived')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: mockArchivedEvents })
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: {} })
        })
      })

      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('First Archived Event')).toBeInTheDocument()
      })

      const reactivateButtons = screen.getAllByRole('button', { name: /reactivate/i })
      fireEvent.click(reactivateButtons[0])

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to reactivate this event?')

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/events/event-1/archive', {
          method: 'DELETE'
        })
        expect(mockAlert).toHaveBeenCalledWith('Event reactivated successfully')
      })
    })

    it('should not reactivate event when cancelled', async () => {
      mockConfirm.mockReturnValue(false)

      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('First Archived Event')).toBeInTheDocument()
      })

      const reactivateButtons = screen.getAllByRole('button', { name: /reactivate/i })
      fireEvent.click(reactivateButtons[0])

      expect(mockConfirm).toHaveBeenCalled()
      // Should not make API call for reactivation
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/archive'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should handle reactivation error', async () => {
      mockConfirm.mockReturnValue(true)
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/archive') && options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: false, error: { message: 'Reactivation failed' } })
          })
        }
        // Default behavior for other calls
        if (url.includes('/api/events?status=archived')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: mockArchivedEvents })
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: {} })
        })
      })

      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText('First Archived Event')).toBeInTheDocument()
      })

      const reactivateButtons = screen.getAllByRole('button', { name: /reactivate/i })
      fireEvent.click(reactivateButtons[0])

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Reactivation failed')
      })
    })
  })

  describe('Duration Calculation', () => {
    it('should calculate duration correctly for events lasting days', async () => {
      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText(/Duration: 1d/)).toBeInTheDocument()
      })
    })

    it('should calculate duration correctly for events lasting hours', async () => {
      const shortEvent: Event = {
        id: 'short-event',
        name: 'Short Event',
        creatorId: 'creator-1',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        endedAt: new Date('2024-01-01T15:30:00Z'), // 5.5 hours later
        isActive: false,
        attendanceTableName: 'short_event_attendance',
        verificationTableName: 'short_event_verification'
      }

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/events?status=archived')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, data: [shortEvent] })
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: {} })
        })
      })

      render(<ArchivedEventsList organizationId="test-org" />)

      await waitFor(() => {
        expect(screen.getByText(/Duration: 5h/)).toBeInTheDocument()
      })
    })
  })
})