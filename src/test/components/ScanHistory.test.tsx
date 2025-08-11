import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ScanHistory from '@/components/events/ScanHistory'

// Mock the auth context
const mockGetSchemaName = vi.fn(() => 'org_test')
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    getSchemaName: mockGetSchemaName
  })
}))

// Mock the realtime hook
vi.mock('@/hooks/useRealtime', () => ({
  useRealtime: vi.fn(() => ({
    isConnected: false,
    error: null,
    reconnect: vi.fn(),
    disconnect: vi.fn(),
    clearError: vi.fn()
  }))
}))

// Mock fetch
global.fetch = vi.fn()

describe('ScanHistory', () => {
  const mockVerifications = [
    {
      id: '1',
      name: 'John Doe',
      participantId: 'P001',
      status: 'verified',
      verifiedAt: new Date('2024-01-01T10:00:00Z')
    },
    {
      id: '2',
      name: 'Jane Smith',
      participantId: 'P002',
      status: 'duplicate',
      verifiedAt: new Date('2024-01-01T10:05:00Z')
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          data: mockVerifications
        }
      })
    })
  })

  it('should render scan history with title', async () => {
    render(<ScanHistory eventId="test-event" showTitle={true} />)

    expect(screen.getByText('Recent Scans')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('should render without title when showTitle is false', async () => {
    render(<ScanHistory eventId="test-event" showTitle={false} />)

    expect(screen.queryByText('Recent Scans')).not.toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('should display loading state', () => {
    ;(global.fetch as any).mockImplementation(() => new Promise(() => {}))
    
    render(<ScanHistory eventId="test-event" />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should display empty state when no scans', async () => {
    ;(global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          data: []
        }
      })
    })

    render(<ScanHistory eventId="test-event" />)

    await waitFor(() => {
      expect(screen.getByText('No recent scans')).toBeInTheDocument()
      expect(screen.getByText('QR code scans will appear here in real-time.')).toBeInTheDocument()
    })
  })

  it('should display error state', async () => {
    ;(global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve({
        success: false,
        error: {
          message: 'Failed to fetch'
        }
      })
    })

    render(<ScanHistory eventId="test-event" />)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
    })
  })

  it('should show real-time connection status', async () => {
    const { useRealtime } = await import('@/hooks/useRealtime')
    ;(useRealtime as any).mockReturnValue({
      isConnected: true,
      error: null,
      reconnect: vi.fn(),
      disconnect: vi.fn(),
      clearError: vi.fn()
    })

    render(<ScanHistory eventId="test-event" enableRealtime={true} />)

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument()
    })
  })

  it('should format time ago correctly', async () => {
    const recentTime = new Date(Date.now() - 30000) // 30 seconds ago
    const mockRecentVerifications = [
      {
        id: '1',
        name: 'John Doe',
        participantId: 'P001',
        status: 'verified',
        verifiedAt: recentTime
      }
    ]

    ;(global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          data: mockRecentVerifications
        }
      })
    })

    render(<ScanHistory eventId="test-event" />)

    await waitFor(() => {
      expect(screen.getByText('Just now')).toBeInTheDocument()
    })
  })

  it('should display status badges correctly', async () => {
    render(<ScanHistory eventId="test-event" />)

    await waitFor(() => {
      expect(screen.getByText('verified')).toBeInTheDocument()
      expect(screen.getByText('duplicate')).toBeInTheDocument()
    })
  })

  it('should call fetch with correct parameters', () => {
    render(<ScanHistory eventId="test-event" limit={5} />)

    expect(global.fetch).toHaveBeenCalledWith('/api/events/test-event/verifications?limit=5&page=1')
  })

  it('should set up real-time subscription with correct parameters', async () => {
    const { useRealtime } = await import('@/hooks/useRealtime')
    
    render(
      <ScanHistory 
        eventId="test-event" 
        verificationTableName="test_verification"
        enableRealtime={true}
      />
    )

    expect(useRealtime).toHaveBeenCalledWith({
      eventId: 'test-event',
      schemaName: 'org_test',
      verificationTableName: 'test_verification',
      enabled: true,
      onVerificationUpdate: expect.any(Function)
    })
  })

  it('should not set up real-time when disabled', async () => {
    const { useRealtime } = await import('@/hooks/useRealtime')
    
    render(<ScanHistory eventId="test-event" enableRealtime={false} />)

    expect(useRealtime).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false
      })
    )
  })
})