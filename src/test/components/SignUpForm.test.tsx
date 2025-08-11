import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SignUpForm from '@/components/auth/SignUpForm'

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

describe('SignUpForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
  })

  it('renders all form fields', () => {
    render(<SignUpForm />)
    
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByLabelText('Organization Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
  })

  it('renders form title and sign-in link', () => {
    render(<SignUpForm />)
    
    expect(screen.getByText('Create your organization')).toBeInTheDocument()
    expect(screen.getByText('sign in to existing account')).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<SignUpForm />)
    
    const submitButton = screen.getByRole('button', { name: /create organization/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      expect(screen.getByText('Organization name must be at least 2 characters')).toBeInTheDocument()
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    })
  })

  it('shows validation error for password mismatch', async () => {
    render(<SignUpForm />)
    
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'different123' }
    })

    const submitButton = screen.getByRole('button', { name: /create organization/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ success: true })
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<SignUpForm />)
    
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Organization Name'), {
      target: { value: 'Test Organization' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' }
    })

    const submitButton = screen.getByRole('button', { name: /create organization/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          organizationName: 'Test Organization',
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

    render(<SignUpForm />)
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Organization Name'), {
      target: { value: 'Test Organization' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' }
    })

    const submitButton = screen.getByRole('button', { name: /create organization/i })
    fireEvent.click(submitButton)

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Creating Account...')).toBeInTheDocument()
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
        error: { message: 'Email already exists' }
      })
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<SignUpForm />)
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Organization Name'), {
      target: { value: 'Test Organization' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' }
    })

    const submitButton = screen.getByRole('button', { name: /create organization/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('shows success message after successful registration', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ success: true })
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    render(<SignUpForm />)
    
    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Organization Name'), {
      target: { value: 'Test Organization' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'password123' }
    })

    const submitButton = screen.getByRole('button', { name: /create organization/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Registration Successful!')).toBeInTheDocument()
      expect(screen.getByText('Your organization has been created. Redirecting to dashboard...')).toBeInTheDocument()
    })
  })
})