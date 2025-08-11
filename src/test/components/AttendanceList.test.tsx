import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AttendanceList from '@/components/events/AttendanceList'
import { VerificationRecord } from '@/types'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

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
  },
  {
    id: 'ver-3',
    name: 'Bob Johnson',
    participantId: 'P003',
    status: 'invalid' as const,
    verifiedAt: new Date('2024-01-01T11:10:00Z')
  }
]

describe('AttendanceList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful response
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          data: mockVerifications,
          total: mockVerifications.length,
          page: 1,
          limit: 50,
          hasMore: false
        }
      })
    })
  })

  it('renders loading state initially', () => {
    render(<AttendanceList eventId="event-1" />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders attendance records table', async () => {
    render(<AttendanceList eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Attendance Records')).toBeInTheDocument()
    })
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    expect(screen.getByText('P001')).toBeInTheDocument()
    expect(screen.getByText('P002')).toBeInTheDocument()
    expect(screen.getByText('P003')).toBeInTheDocument()
  })

  it('displays correct status badges and icons', async () => {
    render(<AttendanceList eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('verified')).toBeInTheDocument()
    })
    
    expect(screen.getByText('duplicate')).toBeInTheDocument()
    expect(screen.getByText('invalid')).toBeInTheDocument()
    
    // Check for status icons (by checking for specific SVG paths)
    const verifiedIcon = screen.getByText('verified').closest('tr')?.querySelector('svg')
    expect(verifiedIcon).toBeInTheDocument()
  })

  it('shows search functionality when enabled', async () => {
    render(<AttendanceList eventId="event-1" showSearch={true} />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search by name or ID...')).toBeInTheDocument()
    })
  })

  it('hides search functionality when disabled', async () => {
    render(<AttendanceList eventId="event-1" showSearch={false} />)
    
    await waitFor(() => {
      expect(screen.getByText('Attendance Records')).toBeInTheDocument()
    })
    
    expect(screen.queryByPlaceholderText('Search by name or ID...')).not.toBeInTheDocument()
  })

  it('filters records based on search input', async () => {
    render(<AttendanceList eventId="event-1" showSearch={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
    
    // Verify all records are initially shown
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    
    const searchInput = screen.getByPlaceholderText('Search by name or ID...')
    
    // Use userEvent for more realistic interaction
    await fireEvent.change(searchInput, { target: { value: 'John Doe' } })
    
    // Check that the input value was updated
    expect(searchInput).toHaveValue('John Doe')
    
    // The filtering should happen immediately since it's client-side
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
  })

  it('filters records by participant ID', async () => {
    render(<AttendanceList eventId="event-1" showSearch={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('P001')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('Search by name or ID...')
    fireEvent.change(searchInput, { target: { value: 'P002' } })
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
  })

  it('displays record count', async () => {
    render(<AttendanceList eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('3 records')).toBeInTheDocument()
    })
  })

  it('displays singular record count', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          data: [mockVerifications[0]],
          total: 1,
          page: 1,
          limit: 50,
          hasMore: false
        }
      })
    })
    
    render(<AttendanceList eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('1 record')).toBeInTheDocument()
    })
  })

  it('shows load more button when hasMore is true', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          data: mockVerifications,
          total: 100,
          page: 1,
          limit: 50,
          hasMore: true
        }
      })
    })
    
    render(<AttendanceList eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Load More')).toBeInTheDocument()
    })
  })

  it('hides load more button when limit is set', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          data: mockVerifications,
          total: 100,
          page: 1,
          limit: 10,
          hasMore: true
        }
      })
    })
    
    render(<AttendanceList eventId="event-1" limit={10} />)
    
    await waitFor(() => {
      expect(screen.getByText('Attendance Records')).toBeInTheDocument()
    })
    
    expect(screen.queryByText('Load More')).not.toBeInTheDocument()
  })

  it('loads more records when load more button is clicked', async () => {
    let callCount = 0
    mockFetch.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              data: [mockVerifications[0]],
              total: 3,
              page: 1,
              limit: 1,
              hasMore: true
            }
          })
        })
      } else {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              data: [mockVerifications[1]],
              total: 3,
              page: 2,
              limit: 1,
              hasMore: true
            }
          })
        })
      }
    })
    
    render(<AttendanceList eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
    
    const loadMoreButton = screen.getByText('Load More')
    fireEvent.click(loadMoreButton)
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
    
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('displays empty state when no records exist', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          data: [],
          total: 0,
          page: 1,
          limit: 50,
          hasMore: false
        }
      })
    })
    
    render(<AttendanceList eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('No attendance records')).toBeInTheDocument()
    })
    
    expect(screen.getByText('No one has checked in yet.')).toBeInTheDocument()
  })

  it('displays empty search state when no records match search', async () => {
    render(<AttendanceList eventId="event-1" showSearch={true} />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('Search by name or ID...')
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } })
    
    expect(screen.getByText('No attendance records')).toBeInTheDocument()
    expect(screen.getByText('No records match your search criteria.')).toBeInTheDocument()
  })

  it('displays error state when API call fails', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        success: false,
        error: { message: 'API Error' }
      })
    })
    
    render(<AttendanceList eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
    
    expect(screen.getByText('API Error')).toBeInTheDocument()
  })

  it('handles network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    
    render(<AttendanceList eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Failed to fetch verification records')).toBeInTheDocument()
  })

  it('formats dates correctly', async () => {
    render(<AttendanceList eventId="event-1" />)
    
    await waitFor(() => {
      expect(screen.getAllByText(/1\/1\/2024/)).toHaveLength(3)
    })
  })

  it('makes correct API calls with pagination parameters', async () => {
    render(<AttendanceList eventId="event-1" limit={25} />)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/events/event-1/verifications?page=1&limit=25'
      )
    })
  })

  it('makes API calls without limit parameter when not specified', async () => {
    render(<AttendanceList eventId="event-1" />)
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/events/event-1/verifications?page=1'
      )
    })
  })
})