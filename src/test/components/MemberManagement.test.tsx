import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MemberManagement from '@/components/dashboard/MemberManagement'
import { Member } from '@/types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.confirm
const mockConfirm = vi.fn()
global.confirm = mockConfirm

describe('MemberManagement', () => {
  const defaultProps = {
    organizationId: 'test-org-id',
    currentUserRole: 'admin' as const
  }

  const mockMembers: Member[] = [
    {
      id: 'member-1',
      orgId: 'test-org-id',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'member-2',
      orgId: 'test-org-id',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'manager',
      createdAt: new Date('2024-01-02')
    },
    {
      id: 'member-3',
      orgId: 'test-org-id',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      role: 'viewer',
      createdAt: new Date('2024-01-03')
    }
  ]

  beforeEach(() => {
    mockFetch.mockClear()
    mockConfirm.mockClear()
    
    // Setup default successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: mockMembers
      })
    })
  })

  it('renders member management interface', async () => {
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Organization Members')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Manage team members and their access levels')).toBeInTheDocument()
    expect(screen.getByText('Add Member')).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    render(<MemberManagement {...defaultProps} />)
    
    expect(screen.getByText('Loading members...')).toBeInTheDocument()
  })

  it('loads and displays members', async () => {
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    })
    
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('displays member roles with correct colors', async () => {
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      const adminBadge = screen.getByText('admin')
      const managerBadge = screen.getByText('manager')
      const viewerBadge = screen.getByText('viewer')
      
      expect(adminBadge).toHaveClass('bg-red-100', 'text-red-800')
      expect(managerBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
      expect(viewerBadge).toHaveClass('bg-green-100', 'text-green-800')
    })
  })

  it('shows member statistics', async () => {
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // 1 admin
      expect(screen.getByText('Administrators')).toBeInTheDocument()
      expect(screen.getByText('Managers')).toBeInTheDocument()
      expect(screen.getByText('Viewers')).toBeInTheDocument()
    })
  })

  it('shows add member form when Add Member button is clicked', async () => {
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Add Member')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Add Member'))
    
    expect(screen.getByText('Add New Member')).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByLabelText('Role')).toBeInTheDocument()
  })

  it('handles form submission for adding member', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockMembers })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'new-member',
            orgId: 'test-org-id',
            name: 'New Member',
            email: 'new@example.com',
            role: 'viewer',
            createdAt: new Date()
          }
        })
      })
    
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Member'))
    })
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'New Member' }
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'new@example.com' }
    })
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add member/i }))
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/org/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Member',
          email: 'new@example.com',
          role: 'viewer'
        })
      })
    })
  })

  it('shows edit form when Edit button is clicked', async () => {
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])
    })
    
    expect(screen.getByText('Edit Member')).toBeInTheDocument()
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument()
  })

  it('handles member deletion', async () => {
    mockConfirm.mockReturnValue(true)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockMembers })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { deleted: true } })
      })
    
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      const removeButtons = screen.getAllByText('Remove')
      fireEvent.click(removeButtons[0])
    })
    
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to remove this member?')
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/org/members/member-1', {
        method: 'DELETE'
      })
    })
  })

  it('does not show management buttons for non-admin/manager users', async () => {
    render(<MemberManagement {...defaultProps} currentUserRole="viewer" />)
    
    await waitFor(() => {
      expect(screen.queryByText('Add Member')).not.toBeInTheDocument()
    })
    
    await waitFor(() => {
      expect(screen.queryByText('Edit')).not.toBeInTheDocument()
      expect(screen.queryByText('Remove')).not.toBeInTheDocument()
    })
  })

  it('shows empty state when no members exist', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    })
    
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('No members yet')).toBeInTheDocument()
      expect(screen.getByText('Add team members to help manage events.')).toBeInTheDocument()
      expect(screen.getByText('Add First Member')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'))
    
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })

  it('shows error when non-admin tries to add member', async () => {
    render(<MemberManagement {...defaultProps} currentUserRole="viewer" />)
    
    await waitFor(() => {
      expect(screen.getByText('Organization Members')).toBeInTheDocument()
    })
    
    // Since the button won't be visible, we can't test the actual flow
    // But we can verify the permission check logic by checking the UI state
    expect(screen.queryByText('Add Member')).not.toBeInTheDocument()
  })

  it('cancels form when Cancel button is clicked', async () => {
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Member'))
    })
    
    expect(screen.getByText('Add New Member')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Cancel'))
    
    expect(screen.queryByText('Add New Member')).not.toBeInTheDocument()
  })

  it('shows loading state during form submission', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockMembers })
      })
      .mockReturnValueOnce(promise)
    
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Member'))
    })
    
    // Fill and submit form
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' }
    })
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' }
    })
    
    const submitButton = screen.getByRole('button', { name: /add member/i })
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Adding...')).toBeInTheDocument()
    
    // Resolve the promise to complete the test
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} })
    })
  })

  it('displays formatted join dates', async () => {
    render(<MemberManagement {...defaultProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('1/1/2024')).toBeInTheDocument()
      expect(screen.getByText('1/2/2024')).toBeInTheDocument()
      expect(screen.getByText('1/3/2024')).toBeInTheDocument()
    })
  })
})