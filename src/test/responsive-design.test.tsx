import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SignUpForm from '@/components/auth/SignUpForm'
import QRScanner from '@/components/events/QRScanner'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

// Mock react-hook-form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(() => ({})),
    handleSubmit: vi.fn((fn) => (e: any) => {
      e.preventDefault()
      fn({})
    }),
    formState: { errors: {} },
    reset: vi.fn(),
  }),
}))

// Mock @zxing/library for QR scanner
vi.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: vi.fn(() => ({
    listVideoInputDevices: vi.fn(() => Promise.resolve([])),
    decodeFromVideoDevice: vi.fn(),
    reset: vi.fn(),
  })),
  NotFoundException: class NotFoundException extends Error {},
}))

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }]
    })),
  },
})

describe('Responsive Design Tests', () => {
  let originalInnerWidth: number
  let originalInnerHeight: number

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight
  })

  afterEach(() => {
    // Restore original window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    })
    window.dispatchEvent(new Event('resize'))
  })

  const setViewport = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    })
    window.dispatchEvent(new Event('resize'))
  }

  describe('Header Component Responsive Behavior', () => {
    it('should show mobile menu button on mobile viewport', async () => {
      setViewport(375, 667) // iPhone SE dimensions
      
      render(<Header />)
      
      await waitFor(() => {
        const mobileMenuButton = screen.getByLabelText('Toggle menu')
        expect(mobileMenuButton).toBeInTheDocument()
        expect(mobileMenuButton).toBeVisible()
      })
    })

    it('should hide desktop navigation on mobile viewport', async () => {
      setViewport(375, 667)
      
      render(<Header />)
      
      await waitFor(() => {
        const desktopNav = screen.queryByText('Home')
        // Desktop nav should be hidden on mobile
        expect(desktopNav).not.toBeVisible()
      })
    })

    it('should show desktop navigation on desktop viewport', async () => {
      setViewport(1024, 768) // Desktop dimensions
      
      render(<Header />)
      
      await waitFor(() => {
        const homeLink = screen.getByText('Home')
        const featuresLink = screen.getByText('Features')
        const aboutLink = screen.getByText('About')
        
        expect(homeLink).toBeVisible()
        expect(featuresLink).toBeVisible()
        expect(aboutLink).toBeVisible()
      })
    })

    it('should toggle mobile menu when button is clicked', async () => {
      setViewport(375, 667)
      
      render(<Header />)
      
      await waitFor(() => {
        const mobileMenuButton = screen.getByLabelText('Toggle menu')
        fireEvent.click(mobileMenuButton)
      })

      await waitFor(() => {
        const mobileHomeLink = screen.getByText('Home')
        expect(mobileHomeLink).toBeVisible()
      })
    })

    it('should have touch-friendly button sizes on mobile', async () => {
      setViewport(375, 667)
      
      render(<Header />)
      
      await waitFor(() => {
        const mobileMenuButton = screen.getByLabelText('Toggle menu')
        const buttonStyles = window.getComputedStyle(mobileMenuButton)
        
        // Should have minimum touch target size (44px)
        expect(parseInt(buttonStyles.minHeight)).toBeGreaterThanOrEqual(44)
        expect(parseInt(buttonStyles.minWidth)).toBeGreaterThanOrEqual(44)
      })
    })
  })

  describe('Footer Component Responsive Behavior', () => {
    it('should stack columns on mobile viewport', async () => {
      setViewport(375, 667)
      
      render(<Footer />)
      
      await waitFor(() => {
        const footer = screen.getByRole('contentinfo')
        expect(footer).toBeInTheDocument()
        
        // Check that links are touch-friendly
        const productLinks = screen.getAllByText(/Features|Pricing|Documentation/)
        productLinks.forEach(link => {
          const linkStyles = window.getComputedStyle(link)
          expect(parseInt(linkStyles.minHeight)).toBeGreaterThanOrEqual(44)
        })
      })
    })

    it('should show grid layout on desktop viewport', async () => {
      setViewport(1024, 768)
      
      render(<Footer />)
      
      await waitFor(() => {
        const footer = screen.getByRole('contentinfo')
        expect(footer).toBeInTheDocument()
        
        // Footer should be visible and properly laid out
        const brandSection = screen.getByText('Scan-ttendance')
        expect(brandSection).toBeVisible()
      })
    })
  })

  describe('SignUpForm Component Responsive Behavior', () => {
    it('should have mobile-optimized input sizes', async () => {
      setViewport(375, 667)
      
      render(<SignUpForm />)
      
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter your full name')
        const inputStyles = window.getComputedStyle(nameInput)
        
        // Should have larger padding and font size on mobile
        expect(parseInt(inputStyles.fontSize)).toBeGreaterThanOrEqual(16) // Prevents zoom on iOS
        expect(parseInt(inputStyles.paddingTop)).toBeGreaterThanOrEqual(12)
        expect(parseInt(inputStyles.paddingBottom)).toBeGreaterThanOrEqual(12)
      })
    })

    it('should have touch-friendly submit button', async () => {
      setViewport(375, 667)
      
      render(<SignUpForm />)
      
      await waitFor(() => {
        const submitButton = screen.getByText('Create Organization')
        const buttonStyles = window.getComputedStyle(submitButton)
        
        // Should have minimum touch target size
        expect(parseInt(buttonStyles.minHeight)).toBeGreaterThanOrEqual(48)
      })
    })

    it('should maintain proper spacing on different screen sizes', async () => {
      // Test mobile
      setViewport(375, 667)
      const { rerender } = render(<SignUpForm />)
      
      await waitFor(() => {
        const form = screen.getByRole('form')
        expect(form).toBeInTheDocument()
      })

      // Test tablet
      setViewport(768, 1024)
      rerender(<SignUpForm />)
      
      await waitFor(() => {
        const form = screen.getByRole('form')
        expect(form).toBeInTheDocument()
      })

      // Test desktop
      setViewport(1024, 768)
      rerender(<SignUpForm />)
      
      await waitFor(() => {
        const form = screen.getByRole('form')
        expect(form).toBeInTheDocument()
      })
    })
  })

  describe('QRScanner Component Mobile Optimization', () => {
    const mockProps = {
      onScan: vi.fn(),
      onError: vi.fn(),
      isActive: true,
      onClose: vi.fn(),
    }

    it('should render mobile-optimized camera interface', async () => {
      setViewport(375, 667)
      
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        const scannerTitle = screen.getByText('Scan QR Code')
        expect(scannerTitle).toBeInTheDocument()
        
        const closeButton = screen.getByLabelText('Close scanner')
        const buttonStyles = window.getComputedStyle(closeButton)
        
        // Should have touch-friendly size
        expect(parseInt(buttonStyles.minHeight)).toBeGreaterThanOrEqual(44)
        expect(parseInt(buttonStyles.minWidth)).toBeGreaterThanOrEqual(44)
      })
    })

    it('should show mobile-specific instructions', async () => {
      setViewport(375, 667)
      
      render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        const instructions = screen.getByText(/Hold steady and center the QR code/)
        expect(instructions).toBeInTheDocument()
      })
    })

    it('should adapt to different orientations', async () => {
      // Portrait
      setViewport(375, 667)
      const { rerender } = render(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        const scanner = screen.getByText('Scan QR Code')
        expect(scanner).toBeInTheDocument()
      })

      // Landscape
      setViewport(667, 375)
      rerender(<QRScanner {...mockProps} />)
      
      await waitFor(() => {
        const scanner = screen.getByText('Scan QR Code')
        expect(scanner).toBeInTheDocument()
      })
    })
  })

  describe('Touch Target Accessibility', () => {
    it('should ensure all interactive elements meet minimum touch target size', async () => {
      setViewport(375, 667)
      
      render(<Header />)
      
      await waitFor(() => {
        const interactiveElements = screen.getAllByRole('button')
        
        interactiveElements.forEach(element => {
          const styles = window.getComputedStyle(element)
          const minHeight = parseInt(styles.minHeight)
          const minWidth = parseInt(styles.minWidth)
          
          // WCAG AA standard for touch targets is 44x44px
          expect(minHeight).toBeGreaterThanOrEqual(44)
          expect(minWidth).toBeGreaterThanOrEqual(44)
        })
      })
    })
  })

  describe('Responsive Typography', () => {
    it('should scale text appropriately across viewports', async () => {
      const TestComponent = () => (
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl">Responsive Heading</h1>
          <p className="text-sm md:text-base">Responsive paragraph</p>
        </div>
      )

      // Mobile
      setViewport(375, 667)
      const { rerender } = render(<TestComponent />)
      
      let heading = screen.getByText('Responsive Heading')
      let mobileStyles = window.getComputedStyle(heading)
      
      // Tablet
      setViewport(768, 1024)
      rerender(<TestComponent />)
      
      heading = screen.getByText('Responsive Heading')
      let tabletStyles = window.getComputedStyle(heading)
      
      // Desktop
      setViewport(1024, 768)
      rerender(<TestComponent />)
      
      heading = screen.getByText('Responsive Heading')
      let desktopStyles = window.getComputedStyle(heading)
      
      // Font size should increase with viewport size
      expect(parseInt(tabletStyles.fontSize)).toBeGreaterThanOrEqual(parseInt(mobileStyles.fontSize))
      expect(parseInt(desktopStyles.fontSize)).toBeGreaterThanOrEqual(parseInt(tabletStyles.fontSize))
    })
  })

  describe('Safe Area Support', () => {
    it('should handle safe area insets on devices with notches', async () => {
      setViewport(375, 812) // iPhone X dimensions
      
      render(<Header />)
      
      await waitFor(() => {
        const header = screen.getByRole('banner')
        expect(header).toHaveClass('safe-area-top')
      })
    })
  })

  describe('Performance on Mobile', () => {
    it('should not cause layout shifts during responsive changes', async () => {
      const { rerender } = render(<Header />)
      
      // Simulate rapid viewport changes
      const viewports = [
        [375, 667],   // Mobile
        [768, 1024],  // Tablet
        [1024, 768],  // Desktop
        [375, 667],   // Back to mobile
      ]

      for (const [width, height] of viewports) {
        setViewport(width, height)
        rerender(<Header />)
        
        await waitFor(() => {
          const header = screen.getByRole('banner')
          expect(header).toBeInTheDocument()
        })
      }
    })
  })
})