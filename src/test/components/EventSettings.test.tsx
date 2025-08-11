import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EventSettings from '@/components/events/EventSettings'
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

describe('EventSettings', () => {
  const mockActiveEvent: Event = {
    id: 'test-event-id',
    name: 'Test Event',
    creatorId: 'test-creator-id',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    isActive: true,
    attendanceTableName: 'test_event_attendance',
    verificationTableName: 'test_event_verification'
  }

  const mockArchivedEvent: Event = {
    ...mockActiveEvent,
    isActive: false,
    endedAt: new Date('2024-01-02T15:30:00Z')
  }

  const mockOnEventUpdate = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockConfirm.mockClear()
    mockAlert.mockClear()
    mockOnEventUpdate.mockClear()
    mockOnClose.mockClear()
    mockLocation.href = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render event settings modal for active event', () => {
      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Event Settings')).toBeInTheDocument()
      expect(screen.getByText('Test Event')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Archive Event')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument()
    })

    it('should render event settings modal for archived event', () => {
      render(
        <EventSettings
          event={mockArchivedEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Event Settings')).toBeInTheDocument()
      expect(screen.getByText('Archived')).toBeInTheDocument()
      expect(screen.getByText('Reactivate Event')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reactivate/i })).toBeInTheDocument()
    })

    it('should display event information correctly', () => {
      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Test Event')).toBeInTheDocument()
      expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument() // Created date
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should display ended date for archived events', () => {
      render(
        <EventSettings
          event={mockArchivedEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/1\/2\/2024/)).toBeInTheDocument() // Ended date
    })
  })

  describe('Event Archiving', () => {
    it('should archive event when confirmed', async () => {
      mockConfirm.mockReturnValue(true)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockActiveEvent, isActive: false, endedAt: new Date() }
        })
      })

      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      const archiveButton = screen.getByRole('button', { name: /archive/i })
      fireEvent.click(archiveButton)

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to archive this event? This will prevent further QR code scanning and mark the event as ended.'
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/events/test-event-id/archive', {
          method: 'POST'
        })
      })

      await waitFor(() => {
        expect(mockOnEventUpdate).toHaveBeenCalled()
        expect(mockAlert).toHaveBeenCalledWith('Event archived successfully')
      })
    })

    it('should not archive event when cancelled', async () => {
      mockConfirm.mockReturnValue(false)

      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      const archiveButton = screen.getByRole('button', { name: /archive/i })
      fireEvent.click(archiveButton)

      expect(mockConfirm).toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockOnEventUpdate).not.toHaveBeenCalled()
    })

    it('should handle archive error', async () => {
      mockConfirm.mockReturnValue(true)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: { message: 'Archive failed' }
        })
      })

      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      const archiveButton = screen.getByRole('button', { name: /archive/i })
      fireEvent.click(archiveButton)

      await waitFor(() => {
        expect(screen.getByText('Archive failed')).toBeInTheDocument()
      })

      expect(mockOnEventUpdate).not.toHaveBeenCalled()
      expect(mockAlert).not.toHaveBeenCalled()
    })
  })

  describe('Event Reactivation', () => {
    it('should reactivate event when confirmed', async () => {
      mockConfirm.mockReturnValue(true)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { ...mockArchivedEvent, isActive: true, endedAt: null }
        })
      })

      render(
        <EventSettings
          event={mockArchivedEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      const reactivateButton = screen.getByRole('button', { name: /reactivate/i })
      fireEvent.click(reactivateButton)

      expect(mockConfirm).toHaveBeenCalledWith(
        'Are you sure you want to reactivate this event? This will allow QR code scanning again.'
      )

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/events/test-event-id/archive', {
          method: 'DELETE'
        })
      })

      await waitFor(() => {
        expect(mockOnEventUpdate).toHaveBeenCalled()
        expect(mockAlert).toHaveBeenCalledWith('Event reactivated successfully')
      })
    })

    it('should not reactivate event when cancelled', async () => {
      mockConfirm.mockReturnValue(false)

      render(
        <EventSettings
          event={mockArchivedEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      const reactivateButton = screen.getByRole('button', { name: /reactivate/i })
      fireEvent.click(reactivateButton)

      expect(mockConfirm).toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockOnEventUpdate).not.toHaveBeenCalled()
    })
  })

  describe('Event Deletion', () => {
    it('should show delete confirmation modal', async () => {
      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete Event')).toBeInTheDocument()
        expect(screen.getByText(/Are you absolutely sure/)).toBeInTheDocument()
        expect(screen.getByText(/All attendance records/)).toBeInTheDocument()
      })
    })

    it('should delete event when confirmed in modal', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { deleted: true }
        })
      })

      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      // Open delete confirmation modal
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      // Confirm deletion in modal
      await waitFor(() => {
        const confirmDeleteButton = screen.getByRole('button', { name: /delete event/i })
        fireEvent.click(confirmDeleteButton)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/events/test-event-id', {
          method: 'DELETE'
        })
      })

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Event deleted successfully')
        expect(mockLocation.href).toBe('/dashboard')
      })
    })

    it('should cancel deletion when cancelled in modal', async () => {
      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      // Open delete confirmation modal
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      // Cancel deletion in modal
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        fireEvent.click(cancelButton)
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(screen.queryByText('Delete Event')).not.toBeInTheDocument()
    })
  })

  describe('Modal Controls', () => {
    it('should close modal when close button is clicked', () => {
      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close modal when X button is clicked', () => {
      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      // Find the X button (close icon)
      const xButton = screen.getByRole('button', { name: '' }) // X button typically has no text
      fireEvent.click(xButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading state during archive operation', async () => {
      mockConfirm.mockReturnValue(true)
      
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true, data: mockArchivedEvent })
          }), 100)
        )
      )

      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      const archiveButton = screen.getByRole('button', { name: /archive/i })
      fireEvent.click(archiveButton)

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Archiving...')).toBeInTheDocument()
      })
    })

    it('should disable buttons during loading', async () => {
      mockConfirm.mockReturnValue(true)
      
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true, data: mockArchivedEvent })
          }), 100)
        )
      )

      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      const archiveButton = screen.getByRole('button', { name: /archive/i })
      fireEvent.click(archiveButton)

      // Button should be disabled during loading
      await waitFor(() => {
        expect(archiveButton).toBeDisabled()
      })
    })
  })

  describe('Access Control Information', () => {
    it('should display access control information', () => {
      render(
        <EventSettings
          event={mockActiveEvent}
          onEventUpdate={mockOnEventUpdate}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Access Control')).toBeInTheDocument()
      expect(screen.getByText(/Active events allow QR code scanning/)).toBeInTheDocument()
      expect(screen.getByText(/Archived events are read-only/)).toBeInTheDocument()
      expect(screen.getByText(/Only organization admins can modify/)).toBeInTheDocument()
    })
  })
})