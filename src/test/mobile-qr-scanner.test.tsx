import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import QRScanner from '@/components/events/QRScanner'

// Mock @zxing/library
const mockDecodeFromVideoDevice = vi.fn()
const mockReset = vi.fn()
const mockListVideoInputDevices = vi.fn()

vi.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: vi.fn(() => ({
    listVideoInputDevices: mockListVideoInputDevices,
    decodeFromVideoDevice: mockDecodeFromVideoDevice,
    reset: mockReset,
  })),
  NotFoundException: class NotFoundException extends Error {},
}))

// Mock navigator APIs
const mockGetUserMedia = vi.fn()
const mockVibrate = vi.fn()

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
})

Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: mockVibrate,
})

// Mock user agent for mobile detection
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
})

describe('Mobile QR Scanner Optimization', () => {
  const mockProps = {
    onScan: vi.fn(),
    onError: vi.fn(),
    isActive: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful camera access
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }]
    })
    
    // Mock video devices with back camera
    mockListVideoInputDevices.mockResolvedValue([
      { deviceId: 'front-camera', label: 'Front Camera' },
      { deviceId: 'back-camera', label: 'Back Camera (environment)' }
    ])
  })

  afterEach(() => {
    document.body.style.overflow = 'unset'
  })

  describe('Mobile Camera Optimization', () => {
    it('should prefer back camera on mobile devices', async () => {
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(mockListVideoInputDevices).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            video: expect.objectContaining({
              facingMode: 'environment'
            })
          })
        )
      })
    })

    it('should use mobile-optimized video constraints', async () => {
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            video: expect.objectContaining({
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30, max: 30 }
            })
          })
        )
      })
    })

    it('should handle camera permission errors gracefully', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('NotAllowedError'))
      
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Camera Permission Required')).toBeInTheDocument()
      })
    })

    it('should handle camera not found error', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('NotFoundError'))
      
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(mockProps.onError).toHaveBeenCalledWith(
          expect.stringContaining('No camera found')
        )
      })
    })

    it('should handle camera in use error', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('NotReadableError'))
      
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(mockProps.onError).toHaveBeenCalledWith(
          expect.stringContaining('Camera is being used by another application')
        )
      })
    })
  })

  describe('Mobile UI Optimization', () => {
    it('should prevent body scroll when scanner is active', async () => {
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden')
      })
    })

    it('should restore body scroll when scanner is closed', async () => {
      const { unmount } = render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden')
      })

      unmount()
      
      expect(document.body.style.overflow).toBe('unset')
    })

    it('should show mobile-specific instructions', async () => {
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByText(/Hold steady and center the QR code/)).toBeInTheDocument()
      })
    })

    it('should show flash toggle button on mobile', async () => {
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        const flashButton = screen.getByLabelText('Toggle flash')
        expect(flashButton).toBeInTheDocument()
      })
    })

    it('should have touch-friendly close button', async () => {
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close scanner')
        const styles = window.getComputedStyle(closeButton)
        
        expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44)
        expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44)
      })
    })
  })

  describe('Haptic Feedback', () => {
    it('should provide haptic feedback on successful scan', async () => {
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(mockDecodeFromVideoDevice).toHaveBeenCalled()
      })

      // Simulate successful QR code scan
      const [, , callback] = mockDecodeFromVideoDevice.mock.calls[0]
      const mockResult = { getText: () => 'test-qr-code' }
      
      callback(mockResult, null)
      
      expect(mockVibrate).toHaveBeenCalledWith(200)
      expect(mockProps.onScan).toHaveBeenCalledWith('test-qr-code')
    })

    it('should not vibrate if vibration is not supported', async () => {
      // Remove vibrate from navigator
      delete (navigator as any).vibrate
      
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(mockDecodeFromVideoDevice).toHaveBeenCalled()
      })

      // Simulate successful QR code scan
      const [, , callback] = mockDecodeFromVideoDevice.mock.calls[0]
      const mockResult = { getText: () => 'test-qr-code' }
      
      callback(mockResult, null)
      
      expect(mockProps.onScan).toHaveBeenCalledWith('test-qr-code')
      // Should not throw error even without vibrate support
    })
  })

  describe('Flash Control', () => {
    it('should toggle flash when flash button is clicked', async () => {
      const mockVideoTrack = {
        getCapabilities: () => ({ torch: true }),
        applyConstraints: vi.fn()
      }
      
      const mockStream = {
        getVideoTracks: () => [mockVideoTrack],
        getTracks: () => [{ stop: vi.fn() }]
      }
      
      mockGetUserMedia.mockResolvedValue(mockStream)
      
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        const flashButton = screen.getByLabelText('Toggle flash')
        fireEvent.click(flashButton)
      })

      expect(mockVideoTrack.applyConstraints).toHaveBeenCalledWith({
        advanced: [{ torch: true }]
      })
    })

    it('should handle flash toggle errors gracefully', async () => {
      const mockVideoTrack = {
        getCapabilities: () => ({ torch: true }),
        applyConstraints: vi.fn().mockRejectedValue(new Error('Flash not supported'))
      }
      
      const mockStream = {
        getVideoTracks: () => [mockVideoTrack],
        getTracks: () => [{ stop: vi.fn() }]
      }
      
      mockGetUserMedia.mockResolvedValue(mockStream)
      
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        const flashButton = screen.getByLabelText('Toggle flash')
        fireEvent.click(flashButton)
      })

      // Should not crash the component
      expect(screen.getByText('Scan QR Code')).toBeInTheDocument()
    })
  })

  describe('Orientation Handling', () => {
    it('should adapt camera frame size based on orientation', async () => {
      // Mock portrait orientation
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true })
      
      const { rerender } = render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Scan QR Code')).toBeInTheDocument()
      })

      // Mock landscape orientation
      Object.defineProperty(window, 'innerWidth', { value: 667, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 375, writable: true })
      
      fireEvent(window, new Event('orientationchange'))
      rerender(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('Scan QR Code')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Optimization', () => {
    it('should properly clean up resources when component unmounts', async () => {
      const mockTrack = { stop: vi.fn() }
      const mockStream = {
        getTracks: () => [mockTrack],
        getVideoTracks: () => [mockTrack]
      }
      
      mockGetUserMedia.mockResolvedValue(mockStream)
      
      const { unmount } = render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled()
      })

      unmount()
      
      expect(mockReset).toHaveBeenCalled()
      expect(mockTrack.stop).toHaveBeenCalled()
    })

    it('should prevent zoom gestures during scanning', async () => {
      render(<QRScanner {...mockProps} />)
      
      const preventDefaultSpy = vi.fn()
      const mockTouchEvent = {
        touches: [{ clientX: 100 }, { clientX: 200 }], // Multi-touch
        preventDefault: preventDefaultSpy
      }
      
      // Simulate multi-touch event (pinch gesture)
      document.dispatchEvent(new TouchEvent('touchmove', mockTouchEvent as any))
      
      // Should prevent default to stop zoom
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Accessibility on Mobile', () => {
    it('should have proper ARIA labels for mobile screen readers', async () => {
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        expect(screen.getByLabelText('Close scanner')).toBeInTheDocument()
        expect(screen.getByLabelText('Toggle flash')).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation on mobile devices with keyboards', async () => {
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close scanner')
        
        // Should be focusable
        closeButton.focus()
        expect(document.activeElement).toBe(closeButton)
        
        // Should respond to Enter key
        fireEvent.keyDown(closeButton, { key: 'Enter' })
        expect(mockProps.onClose).toHaveBeenCalled()
      })
    })
  })
})