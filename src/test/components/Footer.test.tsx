import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Footer from '@/components/layout/Footer'
import { vi } from 'zod/locales'

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe('Footer Component', () => {
  it('renders the brand logo and name', () => {
    render(<Footer />)
    
    expect(screen.getByText('Scan-ttendance')).toBeInTheDocument()
  })

  it('renders the application description', () => {
    render(<Footer />)
    
    expect(screen.getByText(/Modern QR code-based attendance tracking/)).toBeInTheDocument()
  })

  it('renders product links section', () => {
    render(<Footer />)
    
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('Pricing')).toBeInTheDocument()
    expect(screen.getByText('Documentation')).toBeInTheDocument()
  })

  it('renders support links section', () => {
    render(<Footer />)
    
    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByText('Help Center')).toBeInTheDocument()
    expect(screen.getByText('Contact Us')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('renders copyright information', () => {
    render(<Footer />)
    
    expect(screen.getByText(/© 2025 Scan-ttendance/)).toBeInTheDocument()
  })

  it('renders developer attribution', () => {
    render(<Footer />)
    
    expect(screen.getByText('Developed by')).toBeInTheDocument()
    expect(screen.getByText('John Jandayan')).toBeInTheDocument()
  })

  it('has correct href attributes for links', () => {
    render(<Footer />)
    
    const featuresLink = screen.getByText('Features').closest('a')
    const aboutLink = screen.getByText('About').closest('a')
    const developerLink = screen.getByText('John Jandayan').closest('a')
    
    expect(featuresLink).toHaveAttribute('href', '/features')
    expect(aboutLink).toHaveAttribute('href', '/about')
    expect(developerLink).toHaveAttribute('href', 'https://github.com/yourusername')
    expect(developerLink).toHaveAttribute('target', '_blank')
    expect(developerLink).toHaveAttribute('rel', 'noopener noreferrer')
  })
})