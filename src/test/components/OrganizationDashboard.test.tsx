import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import OrganizationDashboard from '@/components/dashboard/OrganizationDashboard'

// Mock fetch globally
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

describe('OrganizationDashboard', () => {
  const defaultProps = {
    organizationName: 'Test Organization',
    organizationId: 'test-org-id'
  }

  const mockApiResponses = {
    events: {
      success: true,
      data: [
        {
          id: 'event-1',
          name: 'Test Event 1',
          creatorId: 'user-1',
          createdAt: new Date('2024-01-01'),
          isActive: true,
          attendanceTableName: 'test_event_1_attendance',
          verificationTableName: 'test_event_1_verification'
        },
        {
          id: 'event-2',
          name: 'Test Event 2',
          creatorId: 'user-1',
          createdAt: new Date('2024-01-02'),
          endedAt: new Date('2024-01-03'),
          isActive: false,
          attendanceTableName: 'test_event_2_attendance',
          verificationTableName: 'test_event_2_verification'
        }
      ]
    },
    members: {
      success: true,
      data: [
        {
          id: 'member-1',
          orgId: 'test-org-id',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin' as const,
          createdAt: new Date('2024-01-01')
        },
        {
          id: 'member-2',
          orgId: 'test-org-id',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'manager' as const,
          createdAt: new Date('2024-01-02')
        }
      ]
    },
    stats: {
      success: true,
      data: {
        activeEvents: 1,
        archivedEvents: 1,
        totalMembers: 2,
        recentScans: 5,
        totalAttendance: 25
      }
    }
  }

  beforeEach(() => {
    mockFetch.mockClear()
    mockLocation.href = ''
    
    // Setup default successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.events)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.members)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.stats)
      })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders organization dashboard with correct title', async () => {
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Organization Dashboard')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Manage your events, members, and track attendance')).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    render(<OrganizationDashboard {...defaultProps} />)
    
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
  })

  it('makes API calls to fetch dashboard data', async () => {
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
    
    expect(mockFetch).toHaveBeenCalledWith('/api/events')
    expect(mockFetch).toHaveBeenCalledWith('/api/org/members')
    expect(mockFetch).toHaveBeenCalledWith('/api/org/stats')
  })

  it('displays statistics panel with correct data', async () => {
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Active events
      expect(screen.getByText('2')).toBeInTheDocument() // Total members
      expect(screen.getByText('5')).toBeInTheDocument() // Recent scans
      expect(screen.getByText('25')).toBeInTheDocument() // Total attendance
    })
  })

  it('displays navigation tabs with correct counts', async () => {
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Ongoing Events (1)')).toBeInTheDocument()
      expect(screen.getByText('Archived Events (1)')).toBeInTheDocument()
      expect(screen.getByText('Members (2)')).toBeInTheDocument()
    })
  })

  it('shows ongoing events by default', async () => {
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Ongoing Events')).toBeInTheDocument()
      expect(screen.getByText('Test Event 1')).toBeInTheDocument()
    })
  })

  it('switches to archived events tab when clicked', async () => {
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Ongoing Events (1)')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Archived Events (1)'))
    
    expect(screen.getByText('Archived Events')).toBeInTheDocument()
    expect(screen.getByText('Test Event 2')).toBeInTheDocument()
  })

  it('switches to members tab when clicked', async () => {
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Members (2)')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Members (2)'))
    
    expect(screen.getByText('Organization Members')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('handles create event button click', async () => {
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Create New Event')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Create New Event'))
    
    expect(mockLocation.href).toBe('/events/create')
  })

  it('handles manage members button click', async () => {
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Manage Members')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Manage Members'))
    
    // Should switch to members tab
    expect(screen.getByText('Organization Members')).toBeInTheDocument()
  })

  it('displays empty state for ongoing events when none exist', async () => {
    // Mock empty events response
    mockFetch.mockClear()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.members)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.stats)
      })
    
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('No ongoing events')).toBeInTheDocument()
      expect(screen.getByText('Get started by creating your first event.')).toBeInTheDocument()
    })
  })

  it('displays empty state for members when none exist', async () => {
    // Mock empty members response
    mockFetch.mockClear()
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.events)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.stats)
      })
    
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Members (0)')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Members (0)'))
    
    expect(screen.getByText('No members yet')).toBeInTheDocument()
    expect(screen.getByText('Add team members to help manage events.')).toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    mockFetch.mockClear()
    mockFetch.mockRejectedValue(new Error('API Error'))
    
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('⚠️ Error')).toBeInTheDocument()
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('allows retry after error', async () => {
    mockFetch.mockClear()
    mockFetch.mockRejectedValueOnce(new Error('API Error'))
    
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
    
    // Setup successful responses for retry
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.events)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.members)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.stats)
      })
    
    fireEvent.click(screen.getByText('Retry'))
    
    await waitFor(() => {
      expect(screen.getByText('Test Organization Dashboard')).toBeInTheDocument()
    })
  })

  it('handles non-ok API responses', async () => {
    mockFetch.mockClear()
    mockFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false })
    
    render(<OrganizationDashboard {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('⚠️ Error')).toBeInTheDocument()
    })
  })
})