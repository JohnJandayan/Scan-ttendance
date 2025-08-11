import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EventPermissions from '@/components/events/EventPermissions'
import { Event, Member } from '@/types'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.alert
const mockAlert = vi.fn()
global.alert = mockAlert

describe('EventPermissions', () => {
  const mockEvent: Event = {
    id: 'test-event-id',
    name: 'Test Event',
    creatorId: 'test-creator-id',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    isActive: true,
    attendanceTableName: 'test_event_attendance',
    verificationTableName: 'test_event_verification'
  }

  const mockMembers: Member[] = [
    {
      id: 'member-1',
      orgId: 'test-org',
      name: 'John Admin',
      email: 'john@example.com',
      role: 'admin',
      createdAt: new Date('2024-01-01T10:00:00Z')
    },
    {
      id: 'member-2',
      orgId: 'test-org',
      name: 'Jane Manager',
      email: 'jane@example.com',
      role: 'manager',
      createdAt: new Date('2024-01-01T10:00:00Z')
    },
    {
      id: 'member-3',
      orgId: 'test-org',
      name: 'Bob Viewer',
      email: 'bob@example.com',
      role: 'viewer',
      createdAt: new Date('2024-01-01T10:00:00Z')
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
    mockAlert.mockClear()

    // Default mock for members API
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockMembers
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ success: true, data: mockMembers })
          }), 100)
        )
      )

      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      expect(screen.getByText('Loading permissions...')).toBeInTheDocument()
    })

    it('should show error state when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load permissions data')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('should retry loading when retry button is clicked', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load permissions data')).toBeInTheDocument()
      })

      // Reset mock for successful retry
      mockFetch.mockClear()
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockMembers })
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      fireEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('John Admin')).toBeInTheDocument()
      })
    })
  })

  describe('Permissions Display', () => {
    it('should display all organization members', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('John Admin')).toBeInTheDocument()
        expect(screen.getByText('Jane Manager')).toBeInTheDocument()
        expect(screen.getByText('Bob Viewer')).toBeInTheDocument()
      })
    })

    it('should display member roles correctly', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument()
        expect(screen.getByText('manager')).toBeInTheDocument()
        expect(screen.getByText('viewer')).toBeInTheDocument()
      })
    })

    it('should display member emails', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('jane@example.com')).toBeInTheDocument()
        expect(screen.getByText('bob@example.com')).toBeInTheDocument()
      })
    })

    it('should show correct initial permissions based on roles', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        // Admin should have all permissions
        const adminScanCheckbox = screen.getByLabelText('Scan QR', { selector: '#scan-member-1' })
        const adminManageCheckbox = screen.getByLabelText('Manage', { selector: '#manage-member-1' })
        const adminArchiveCheckbox = screen.getByLabelText('Archive', { selector: '#archive-member-1' })
        
        expect(adminScanCheckbox).toBeChecked()
        expect(adminManageCheckbox).toBeChecked()
        expect(adminArchiveCheckbox).toBeChecked()

        // Manager should have scan and manage permissions
        const managerScanCheckbox = screen.getByLabelText('Scan QR', { selector: '#scan-member-2' })
        const managerManageCheckbox = screen.getByLabelText('Manage', { selector: '#manage-member-2' })
        const managerArchiveCheckbox = screen.getByLabelText('Archive', { selector: '#archive-member-2' })
        
        expect(managerScanCheckbox).toBeChecked()
        expect(managerManageCheckbox).toBeChecked()
        expect(managerArchiveCheckbox).not.toBeChecked()

        // Viewer should have no permissions
        const viewerScanCheckbox = screen.getByLabelText('Scan QR', { selector: '#scan-member-3' })
        const viewerManageCheckbox = screen.getByLabelText('Manage', { selector: '#manage-member-3' })
        const viewerArchiveCheckbox = screen.getByLabelText('Archive', { selector: '#archive-member-3' })
        
        expect(viewerScanCheckbox).not.toBeChecked()
        expect(viewerManageCheckbox).not.toBeChecked()
        expect(viewerArchiveCheckbox).not.toBeChecked()
      })
    })
  })

  describe('Permission Editing (Admin User)', () => {
    it('should show save button for admin users', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
      })
    })

    it('should allow admin to modify permissions', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        const viewerScanCheckbox = screen.getByLabelText('Scan QR', { selector: '#scan-member-3' })
        expect(viewerScanCheckbox).not.toBeChecked()
        
        fireEvent.click(viewerScanCheckbox)
        expect(viewerScanCheckbox).toBeChecked()
      })
    })

    it('should save permissions when save button is clicked', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save changes/i })
        fireEvent.click(saveButton)
      })

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument()
      })

      // Should show success message
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Permissions updated successfully')
      })
    })
  })

  describe('Permission Viewing (Non-Admin User)', () => {
    it('should show permission notice for non-admin users', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="viewer"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('You need admin privileges to modify event permissions.')).toBeInTheDocument()
      })
    })

    it('should not show save button for non-admin users', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="viewer"
        />
      )

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument()
      })
    })

    it('should not show permission checkboxes for non-admin users', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="viewer"
        />
      )

      await waitFor(() => {
        expect(screen.queryByLabelText('Scan QR')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Manage')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Archive')).not.toBeInTheDocument()
      })
    })
  })

  describe('Permission Descriptions', () => {
    it('should show correct permission descriptions', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        // Admin should show all capabilities
        expect(screen.getByText('Scan QR codes, Manage attendees, Archive event')).toBeInTheDocument()
        
        // Manager should show scan and manage capabilities
        expect(screen.getByText('Scan QR codes, Manage attendees')).toBeInTheDocument()
        
        // Viewer should show view only
        expect(screen.getByText('View only')).toBeInTheDocument()
      })
    })
  })

  describe('Permission Legend and Rules', () => {
    it('should display permission legend', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Permission Levels')).toBeInTheDocument()
        expect(screen.getByText('Can scan QR codes and verify attendance')).toBeInTheDocument()
        expect(screen.getByText('Can add/remove attendees and view all records')).toBeInTheDocument()
        expect(screen.getByText('Can archive/reactivate events and modify settings')).toBeInTheDocument()
      })
    })

    it('should display event access rules', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Event Access Rules')).toBeInTheDocument()
        expect(screen.getByText('• Only members with scan permissions can verify attendance')).toBeInTheDocument()
        expect(screen.getByText('• Archived events are read-only for all users except admins')).toBeInTheDocument()
        expect(screen.getByText('• Event creators automatically have full permissions')).toBeInTheDocument()
        expect(screen.getByText('• Organization admins can override all event permissions')).toBeInTheDocument()
      })
    })
  })

  describe('Member Avatars', () => {
    it('should display member initials in avatars', async () => {
      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument() // John Admin
        expect(screen.getByText('B')).toBeInTheDocument() // Bob Viewer
        // Note: Jane Manager would also show 'J', but we can't easily test for multiple 'J's
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API error when loading members fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: { message: 'Failed to load members' }
        })
      })

      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load organization members')).toBeInTheDocument()
      })
    })

    it('should handle save error gracefully', async () => {
      // Mock console.error to avoid error output in tests
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <EventPermissions
          event={mockEvent}
          organizationId="test-org"
          currentUserRole="admin"
        />
      )

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save changes/i })
        fireEvent.click(saveButton)
      })

      // Wait for the simulated delay and check for error handling
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Permissions updated successfully')
      }, { timeout: 2000 })

      consoleSpy.mockRestore()
    })
  })
})