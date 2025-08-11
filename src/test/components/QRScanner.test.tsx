import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import QRScanner from '@/components/events/QRScanner'

// Mock the ZXing library
const mockDecodeFromVideoDevice = vi.fn()
const mockListVideoInputDevices = vi.fn()
const mockReset = vi.fn()

vi.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: vi.fn().mockImplementation(() => ({
    decodeFromVideoDevice: mockDecodeFromVideoDevice,
    listVideoInputDevices: mockListVideoInputDevices,
    reset: mockReset
  })),
  NotFoundException: class NotFoundException extends Error {
    constructor(message?: string) {
      super(message)
      this.name = 'NotFoundException'
    }
  }
}))

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn()
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia
  },
  writable: true
})

describe('QRScanner', () => {
  const mockOnScan = vi.fn()
  const mockOnError = vi.fn()
  const mockOnClose = vi.fn()

  const defaultProps = {
    onScan: mockOnScan,
    onError: mockOnError,
    isActive: true,
    onClose: mockOnClose
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when isActive is false', () => {
    render(<QRScanner {...defaultProps} isActive={false} />)
    
    expect(screen.queryByText('Scan QR Code')).not.toBeInTheDocument()
  })

  it('should handle camera permission denied', async () => {
    const permissionError = new Error('Camera permission denied')
    permissionError.name = 'NotAllowedError'
    mockGetUserMedia.mockRejectedValue(permissionError)
    
    await act(async () => {
      render(<QRScanner {...defaultProps} />)
    })
    
    // Should eventually show permission dialog
    await waitFor(() => {
      expect(screen.getByText('Camera Permission Required')).toBeInTheDocument()
    })
  })

  it('should handle close action from permission dialog', async () => {
    const permissionError = new Error('Camera permission denied')
    permissionError.name = 'NotAllowedError'
    mockGetUserMedia.mockRejectedValue(permissionError)
    
    await act(async () => {
      render(<QRScanner {...defaultProps} />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Camera Permission Required')).toBeInTheDocument()
    })
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should handle retry from permission dialog', async () => {
    const permissionError = new Error('Camera permission denied')
    permissionError.name = 'NotAllowedError'
    mockGetUserMedia.mockRejectedValueOnce(permissionError)
    
    await act(async () => {
      render(<QRScanner {...defaultProps} />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Camera Permission Required')).toBeInTheDocument()
    })
    
    const tryAgainButton = screen.getByText('Try Again')
    fireEvent.click(tryAgainButton)
    
    // Should attempt to get user media again
    expect(mockGetUserMedia).toHaveBeenCalledTimes(2)
  })

  it('should call onError for camera not found', async () => {
    const notFoundError = new Error('No camera found')
    notFoundError.name = 'NotFoundError'
    mockGetUserMedia.mockRejectedValue(notFoundError)
    
    await act(async () => {
      render(<QRScanner {...defaultProps} />)
    })
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('No camera found on this device.')
    })
  })

  it('should call onError for generic camera errors', async () => {
    const genericError = new Error('Generic camera error')
    mockGetUserMedia.mockRejectedValue(genericError)
    
    await act(async () => {
      render(<QRScanner {...defaultProps} />)
    })
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Failed to access camera: Generic camera error')
    })
  })
})