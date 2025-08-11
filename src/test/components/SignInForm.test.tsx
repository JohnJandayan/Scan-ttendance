import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SignInForm from '@/components/auth/SignInForm'

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock fetch
global.fetch = vi.fn()

describe('SignInForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
  })

  it('renders all form fields', () => {
    render(<SignInForm />)
    
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Remember me')).toBeInTheDocument()
  })

  it('renders form title and sign-up link', () => {
    render(<SignInForm />)
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByText('create a new organization')).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    render(<SignInForm />)
    
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<SignInForm />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })



  it('submits form with valid data', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ success: true })
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<SignInForm />)
    
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'john@example.com',
          password: 'password123',
        }),
      })
    })
  })

  it('shows loading state during submission', async () => {
    let resolvePromise: any
    const mockResponse = new Promise(resolve => {
      resolvePromise = resolve
    })
    ;(global.fetch as any).mockReturnValueOnce(mockResponse)

    render(<SignInForm />)
    
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Signing In...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    // Resolve the promise to complete the test
    resolvePromise({
      ok: true,
      json: async () => ({ success: true })
    })
  })

  it('displays error message on failed submission', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({ 
        error: { message: 'Invalid credentials' }
      })
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<SignInForm />)
    
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' }
    })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('handles network errors gracefully', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    render(<SignInForm />)
    
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('has correct link hrefs', () => {
    render(<SignInForm />)
    
    const signUpLink = screen.getByText('create a new organization').closest('a')
    expect(signUpLink).toHaveAttribute('href', '/auth/signup')
  })
})