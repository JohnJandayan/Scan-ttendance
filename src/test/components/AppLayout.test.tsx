import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AppLayout from '@/components/layout/AppLayout'

// Mock the Header and Footer components
vi.mock('@/components/layout/Header', () => ({
  default: () => <div data-testid="header">Header Component</div>
}))

vi.mock('@/components/layout/Footer', () => ({
  default: () => <div data-testid="footer">Footer Component</div>
}))

describe('AppLayout Component', () => {
  it('renders children content', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders header by default', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    )
    
    expect(screen.getByTestId('header')).toBeInTheDocument()
  })

  it('renders footer by default', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    )
    
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('hides header when showHeader is false', () => {
    render(
      <AppLayout showHeader={false}>
        <div>Test Content</div>
      </AppLayout>
    )
    
    expect(screen.queryByTestId('header')).not.toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('hides footer when showFooter is false', () => {
    render(
      <AppLayout showFooter={false}>
        <div>Test Content</div>
      </AppLayout>
    )
    
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('can hide both header and footer', () => {
    render(
      <AppLayout showHeader={false} showFooter={false}>
        <div>Test Content</div>
      </AppLayout>
    )
    
    expect(screen.queryByTestId('header')).not.toBeInTheDocument()
    expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('has correct layout structure', () => {
    const { container } = render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    )
    
    const layoutDiv = container.firstChild as HTMLElement
    expect(layoutDiv).toHaveClass('min-h-screen', 'flex', 'flex-col')
    
    const main = container.querySelector('main')
    expect(main).toHaveClass('flex-grow')
  })
})