import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AttendanceExport from '@/components/events/AttendanceExport'

// Mock fetch
global.fetch = vi.fn()

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true
})

// Mock Blob
Object.defineProperty(global, 'Blob', {
  value: vi.fn().mockImplementation((content, options) => ({
    content,
    options
  })),
  writable: true
})

describe('AttendanceExport', () => {
  const mockAttendanceData = [
    {
      id: '1',
      name: 'John Doe',
      participantId: 'P001',
      status: 'verified',
      verifiedAt: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      name: 'Jane Smith',
      participantId: 'P002',
      status: 'duplicate',
      verifiedAt: '2024-01-01T10:05:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          data: mockAttendanceData
        }
      })
    })

    // Mock document.createElement and appendChild/removeChild
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)
  })

  it('should render export component', () => {
    render(<AttendanceExport eventId="test-event" eventName="Test Event" />)

    expect(screen.getByText('Export Attendance')).toBeInTheDocument()
    expect(screen.getByText('Export Format')).toBeInTheDocument()
    expect(screen.getByText('CSV (Excel compatible)')).toBeInTheDocument()
    expect(screen.getByText('JSON')).toBeInTheDocument()
  })

  it('should have CSV format selected by default', () => {
    render(<AttendanceExport eventId="test-event" />)

    const csvRadio = screen.getByDisplayValue('csv')
    const jsonRadio = screen.getByDisplayValue('json')

    expect(csvRadio).toBeChecked()
    expect(jsonRadio).not.toBeChecked()
  })

  it('should allow format selection', () => {
    render(<AttendanceExport eventId="test-event" />)

    const jsonRadio = screen.getByDisplayValue('json')
    fireEvent.click(jsonRadio)

    expect(jsonRadio).toBeChecked()
    expect(screen.getByDisplayValue('csv')).not.toBeChecked()
  })

  it('should display export information', () => {
    render(<AttendanceExport eventId="test-event" />)

    expect(screen.getByText('Export includes:')).toBeInTheDocument()
    expect(screen.getByText('• Participant names and IDs')).toBeInTheDocument()
    expect(screen.getByText('• Check-in status (verified, duplicate, invalid)')).toBeInTheDocument()
    expect(screen.getByText('• Check-in timestamps')).toBeInTheDocument()
  })

  it('should export CSV when export button is clicked', async () => {
    render(<AttendanceExport eventId="test-event" eventName="Test Event" />)

    const exportButton = screen.getByText('Export CSV')
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/events/test-event/verifications?limit=1000&page=1')
    })

    expect(global.Blob).toHaveBeenCalledWith(
      [expect.stringContaining('Name,Participant ID,Status,Check-in Time')],
      { type: 'text/csv' }
    )
  })

  it('should export JSON when JSON format is selected', async () => {
    render(<AttendanceExport eventId="test-event" eventName="Test Event" />)

    // Select JSON format
    const jsonRadio = screen.getByDisplayValue('json')
    fireEvent.click(jsonRadio)

    const exportButton = screen.getByText('Export JSON')
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    expect(global.Blob).toHaveBeenCalledWith(
      [expect.stringContaining('"event": "Test Event"')],
      { type: 'application/json' }
    )
  })

  it('should show loading state during export', async () => {
    ;(global.fetch as any).mockImplementation(() => new Promise(() => {}))

    render(<AttendanceExport eventId="test-event" />)

    const exportButton = screen.getByText('Export CSV')
    fireEvent.click(exportButton)

    expect(screen.getByText('Exporting...')).toBeInTheDocument()
    expect(exportButton).toBeDisabled()
  })

  it('should handle export error', async () => {
    ;(global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve({
        success: false,
        error: {
          message: 'Export failed'
        }
      })
    })

    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<AttendanceExport eventId="test-event" />)

    const exportButton = screen.getByText('Export CSV')
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to export attendance records')
    })

    alertSpy.mockRestore()
  })

  it('should handle empty data', async () => {
    ;(global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: {
          data: []
        }
      })
    })

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<AttendanceExport eventId="test-event" />)

    const exportButton = screen.getByText('Export CSV')
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('No attendance records to export')
    })

    alertSpy.mockRestore()
  })

  it('should sanitize filename', async () => {
    render(<AttendanceExport eventId="test-event" eventName="Test Event! @#$" />)

    const exportButton = screen.getByText('Export CSV')
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(document.createElement).toHaveBeenCalledWith('a')
    })

    const mockLink = document.createElement('a')
    expect(mockLink.download).toBe('')
  })

  it('should create download link correctly', async () => {
    render(<AttendanceExport eventId="test-event" eventName="Test Event" />)

    const exportButton = screen.getByText('Export CSV')
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled()
      expect(document.body.appendChild).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalled()
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url')
    })
  })
})