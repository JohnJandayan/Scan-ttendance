import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LandingPage from '@/components/landing/LandingPage'

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('LandingPage Component', () => {
  it('renders the main hero heading', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('Modern attendance')).toBeInTheDocument()
    expect(screen.getByText('tracking made simple')).toBeInTheDocument()
  })

  it('renders the hero description', () => {
    render(<LandingPage />)
    
    expect(screen.getByText(/Streamline your event attendance with QR code scanning/)).toBeInTheDocument()
  })

  it('renders call-to-action buttons in hero section', () => {
    render(<LandingPage />)
    
    const getStartedButtons = screen.getAllByText('Get Started Free')
    const learnMoreButton = screen.getByText('Learn More')
    
    expect(getStartedButtons.length).toBeGreaterThan(0)
    expect(learnMoreButton).toBeInTheDocument()
  })

  it('renders features section heading', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Everything you need for attendance tracking')).toBeInTheDocument()
  })

  it('renders all feature items', () => {
    render(<LandingPage />)
    
    expect(screen.getAllByText('QR Code Scanning')).toHaveLength(2) // Hero and features section
    expect(screen.getByText('Real-time Analytics')).toBeInTheDocument()
    expect(screen.getByText('Multi-Organization')).toBeInTheDocument()
    expect(screen.getByText('Mobile Optimized')).toBeInTheDocument()
  })

  it('renders feature descriptions', () => {
    render(<LandingPage />)
    
    expect(screen.getByText(/Fast and accurate attendance verification/)).toBeInTheDocument()
    expect(screen.getByText(/Live attendance statistics and comprehensive reporting/)).toBeInTheDocument()
    expect(screen.getByText(/Secure data isolation for multiple organizations/)).toBeInTheDocument()
    expect(screen.getByText(/Responsive design that works perfectly on mobile devices/)).toBeInTheDocument()
  })

  it('renders call-to-action section', () => {
    render(<LandingPage />)
    
    expect(screen.getByText('Ready to get started?')).toBeInTheDocument()
    expect(screen.getByText('Create your organization today.')).toBeInTheDocument()
  })

  it('has correct href attributes for CTA buttons', () => {
    render(<LandingPage />)
    
    const getStartedLinks = screen.getAllByText(/Get Started/)
    const signInLink = screen.getByText('Sign In').closest('a')
    const learnMoreLink = screen.getByText('Learn More').closest('a')
    
    // Check that at least one Get Started link points to signup
    const signupLinks = getStartedLinks.filter(link => 
      link.closest('a')?.getAttribute('href') === '/auth/signup'
    )
    expect(signupLinks.length).toBeGreaterThan(0)
    
    expect(signInLink).toHaveAttribute('href', '/auth/signin')
    expect(learnMoreLink).toHaveAttribute('href', '/features')
  })

  it('renders QR code visual element', () => {
    render(<LandingPage />)
    
    const qrElements = screen.getAllByText('QR Code Scanning')
    expect(qrElements.length).toBeGreaterThan(0)
  })

  it('has responsive design classes', () => {
    const { container } = render(<LandingPage />)
    
    // Check for responsive grid classes
    expect(container.querySelector('.md\\:grid-cols-2')).toBeInTheDocument()
    expect(container.querySelector('.lg\\:w-full')).toBeInTheDocument()
    expect(container.querySelector('.sm\\:text-5xl')).toBeInTheDocument()
  })
})