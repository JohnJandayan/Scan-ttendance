import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EventDashboard from '@/components/events/EventDashboard'
import { Event, VerificationRecord } from '@/types'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.location
const mockLocation = {
  href: ''
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

// Mock window.confirm and window.alert
global.confirm = vi.fn()
global.alert = vi.fn()

const mockEvent: Event = {
  id: 'event-1',
  name: 'Test Event',
  creatorId: 'user-1',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  endedAt: undefined,
  isActive: true,
  attendanceTableName: 'test_event_attendance',
  verificationTableName: 'test_event_verification'
}

const mockStats = {
  totalAttendees: 100,
  verifiedAttendees: 75,
  verificationRate: 75.0
}

const mockVerifications: VerificationRecord[] = [
  {
    id: 'ver-1',
    name: 'John Doe',
    participantId: 'P001',
    status: 'verified' as const,
    verifiedAt: new Date('2024-01-01T11:00:00Z')
  },
  {
    id: 'ver-2',
    name: 'Jane Smith',
    participantId: 'P002',
    status: 'duplicate' as const,
    verifiedAt: new Date('2024-01-01T11:05:00Z')
  }
]

describe('EventDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
    
    // Default successful responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/events/event-1') && !url.includes('/stats') && !url.includes('/verifications')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: mockEvent
          })
        })
      }
      if (url.includes('/stats')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: mockStats
          })
        })
      }
      if (url.includes('/verifications')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              data: mockVerifications
            }
          })
        })
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: false })
      })
    })
  })

  it('renders loading state initially', () => {
    render(<EventDashboard eventId="event-1" />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders event dashboard with data', async () => {
    render(<EventDashboard eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })
    
    expect(screen.getByText(/Created on/)).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Scan QR Codes')).toBeInTheDocument()
  })

  it('displays event statistics', async () => {
    render(<EventDashboard eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })
    
    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument() // Total attendees
    })
    
    expect(screen.getByText('75')).toBeInTheDocument() // Verified attendees
    expect(screen.getByText('75%')).toBeInTheDocument() // Verification rate
  })

  it('displays recent verifications', async () => {
    render(<EventDashboard eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })
    
    // Wait for verifications to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('ID: P001')).toBeInTheDocument()
    expect(screen.getByText('ID: P002')).toBeInTheDocument()
    expect(screen.getByText('verified')).toBeInTheDocument()
    expect(screen.getByText('duplicate')).toBeInTheDocument()
  })

  it('shows settings panel when settings button is clicked', async () => {
    render(<EventDashboard eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })
    
    const settingsButton = screen.getByText('Settings')
    fireEvent.click(settingsButton)
    
    expect(screen.getByText('Event Settings')).toBeInTheDocument()
    expect(screen.getByText('Archive Event')).toBeInTheDocument()
  })

  it('handles event archiving', async () => {
    const mockConfirm = vi.mocked(global.confirm)
    mockConfirm.mockReturnValue(true)
    
    // Mock archive API response
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/archive') && options?.method === 'POST') {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: { ...mockEvent, isActive: false, endedAt: new Date() }
          })
        })
      }
      // Return default responses for other calls
      if (url.includes('/api/events/event-1')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: mockEvent
          })
        })
      }
      if (url.includes('/stats')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: mockStats
          })
        })
      }
      if (url.includes('/verifications')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: { data: mockVerifications }
          })
        })
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: false })
      })
    })
    
    render(<EventDashboard eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })
    
    // Open settings
    const settingsButton = screen.getByText('Settings')
    fireEvent.click(settingsButton)
    
    // Click archive button
    const archiveButton = screen.getByText('Archive Event')
    fireEvent.click(archiveButton)
    
    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to archive this event? This will prevent further QR code scanning.'
    )
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/events/event-1/archive',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('handles event reactivation for archived events', async () => {
    const archivedEvent = {
      ...mockEvent,
      isActive: false,
      endedAt: new Date('2024-01-02T10:00:00Z')
    }
    
    const mockConfirm = vi.mocked(global.confirm)
    mockConfirm.mockReturnValue(true)
    
    // Mock responses for archived event
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/archive') && options?.method === 'DELETE') {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: { ...archivedEvent, isActive: true, endedAt: null }
          })
        })
      }
      if (url.includes('/api/events/event-1')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: archivedEvent
          })
        })
      }
      if (url.includes('/stats')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: mockStats
          })
        })
      }
      if (url.includes('/verifications')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: { data: mockVerifications }
          })
        })
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: false })
      })
    })
    
    render(<EventDashboard eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Event Archived')).toBeInTheDocument()
    })
    
    // Open settings
    const settingsButton = screen.getByText('Settings')
    fireEvent.click(settingsButton)
    
    // Click reactivate button
    const reactivateButton = screen.getByText('Reactivate Event')
    fireEvent.click(reactivateButton)
    
    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to reactivate this event?'
    )
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/events/event-1/archive',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('navigates to QR scanner when scan button is clicked', async () => {
    render(<EventDashboard eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })
    
    const scanButton = screen.getByText('Scan QR Codes')
    fireEvent.click(scanButton)
    
    expect(mockLocation.href).toBe('/events/event-1/scan')
  })

  it('navigates to full verifications list when view all is clicked', async () => {
    render(<EventDashboard eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Recent Check-ins')).toBeInTheDocument()
    })
    
    const viewAllButton = screen.getByText('View all →')
    fireEvent.click(viewAllButton)
    
    expect(mockLocation.href).toBe('/events/event-1/verifications')
  })

  it('displays error state when API calls fail', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        json: () => Promise.resolve({
          success: false,
          error: { message: 'API Error' }
        })
      })
    })
    
    render(<EventDashboard eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
    
    expect(screen.getByText('API Error')).toBeInTheDocument()
  })

  it('displays empty state when no verifications exist', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/verifications')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: { data: [] }
          })
        })
      }
      if (url.includes('/api/events/event-1')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: mockEvent
          })
        })
      }
      if (url.includes('/stats')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: { ...mockStats, verifiedAttendees: 0, verificationRate: 0 }
          })
        })
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: false })
      })
    })
    
    render(<EventDashboard eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('No check-ins yet')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Start scanning QR codes to see attendance records here.')).toBeInTheDocument()
  })

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    
    render(<EventDashboard eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
    
    // The first error that occurs will be displayed
    expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument()
  })
})