import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProtectedRoute, { withProtectedRoute } from '@/components/auth/ProtectedRoute'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    ;(global.fetch as any).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Verifying authentication...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows custom fallback during loading', () => {
    ;(global.fetch as any).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <ProtectedRoute fallback={<div>Custom Loading...</div>}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Verifying authentication...')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ authenticated: true })
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify', {
      method: 'GET',
      credentials: 'include',
    })
  })

  it('redirects to sign-in when not authenticated', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({ error: 'Not authenticated' })
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to sign-in on network error', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})

describe('withProtectedRoute HOC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wraps component with ProtectedRoute', async () => {
    const TestComponent = ({ message }: { message: string }) => (
      <div>{message}</div>
    )
    
    const ProtectedTestComponent = withProtectedRoute(TestComponent)

    const mockResponse = {
      ok: true,
      json: async () => ({ authenticated: true })
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<ProtectedTestComponent message="Hello World" />)

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })
  })

  it('uses custom fallback in HOC', () => {
    const TestComponent = () => <div>Test Component</div>
    const customFallback = <div>HOC Loading...</div>
    
    const ProtectedTestComponent = withProtectedRoute(TestComponent, customFallback)

    ;(global.fetch as any).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<ProtectedTestComponent />)

    expect(screen.getByText('HOC Loading...')).toBeInTheDocument()
  })
})