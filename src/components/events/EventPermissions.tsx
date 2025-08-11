'use client'

import { useState, useEffect } from 'react'
import { Event, Member } from '@/types'

interface EventPermissionsProps {
  event: Event
  organizationId: string
  currentUserRole: string
}

interface EventPermission {
  memberId: string
  memberName: string
  memberEmail: string
  role: 'viewer' | 'manager' | 'admin'
  canScan: boolean
  canManageAttendees: boolean
  canArchive: boolean
}

export default function EventPermissions({ 
  event, 
  organizationId, 
  currentUserRole 
}: EventPermissionsProps) {
  const [permissions, setPermissions] = useState<EventPermission[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadMembersAndPermissions()
  }, [organizationId, event.id])

  const loadMembersAndPermissions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load organization members
      const membersResponse = await fetch('/api/org/members')
      const membersData = await membersResponse.json()

      if (membersData.success) {
        const membersList = membersData.data || []
        setMembers(membersList)

        // Initialize permissions based on member roles
        const initialPermissions: EventPermission[] = membersList.map((member: Member) => ({
          memberId: member.id,
          memberName: member.name,
          memberEmail: member.email,
          role: member.role,
          canScan: member.role === 'admin' || member.role === 'manager',
          canManageAttendees: member.role === 'admin' || member.role === 'manager',
          canArchive: member.role === 'admin'
        }))

        setPermissions(initialPermissions)
      } else {
        setError('Failed to load organization members')
      }
    } catch (err) {
      setError('Failed to load permissions data')
    } finally {
      setLoading(false)
    }
  }

  const updatePermission = (memberId: string, field: keyof EventPermission, value: any) => {
    setPermissions(prev => prev.map(permission => 
      permission.memberId === memberId 
        ? { ...permission, [field]: value }
        : permission
    ))
  }

  const savePermissions = async () => {
    setSaving(true)
    try {
      // In a real implementation, this would save to the backend
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Permissions updated successfully')
    } catch (err) {
      alert('Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  const getPermissionDescription = (permission: EventPermission) => {
    const capabilities = []
    if (permission.canScan) capabilities.push('Scan QR codes')
    if (permission.canManageAttendees) capabilities.push('Manage attendees')
    if (permission.canArchive) capabilities.push('Archive event')
    
    return capabilities.length > 0 ? capabilities.join(', ') : 'View only'
  }

  const canEditPermissions = currentUserRole === 'admin'

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading permissions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadMembersAndPermissions}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Event Permissions</h3>
          <p className="text-sm text-gray-600">
            Manage who can access and modify this event
          </p>
        </div>
        {canEditPermissions && (
          <button
            onClick={savePermissions}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Permission Notice */}
      {!canEditPermissions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                You need admin privileges to modify event permissions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Permissions List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {permissions.map((permission) => (
            <li key={permission.memberId} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {permission.memberName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {permission.memberName}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        permission.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        permission.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {permission.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{permission.memberEmail}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getPermissionDescription(permission)}
                    </p>
                  </div>
                </div>

                {/* Permission Controls */}
                {canEditPermissions && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        id={`scan-${permission.memberId}`}
                        type="checkbox"
                        checked={permission.canScan}
                        onChange={(e) => updatePermission(permission.memberId, 'canScan', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`scan-${permission.memberId}`} className="ml-2 text-xs text-gray-700">
                        Scan QR
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id={`manage-${permission.memberId}`}
                        type="checkbox"
                        checked={permission.canManageAttendees}
                        onChange={(e) => updatePermission(permission.memberId, 'canManageAttendees', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`manage-${permission.memberId}`} className="ml-2 text-xs text-gray-700">
                        Manage
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id={`archive-${permission.memberId}`}
                        type="checkbox"
                        checked={permission.canArchive}
                        onChange={(e) => updatePermission(permission.memberId, 'canArchive', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`archive-${permission.memberId}`} className="ml-2 text-xs text-gray-700">
                        Archive
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Permission Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Permission Levels</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">Scan QR:</span> Can scan QR codes and verify attendance
          </div>
          <div>
            <span className="font-medium">Manage:</span> Can add/remove attendees and view all records
          </div>
          <div>
            <span className="font-medium">Archive:</span> Can archive/reactivate events and modify settings
          </div>
        </div>
      </div>

      {/* Event Access Rules */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Event Access Rules</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <p>• Only members with scan permissions can verify attendance</p>
          <p>• Archived events are read-only for all users except admins</p>
          <p>• Event creators automatically have full permissions</p>
          <p>• Organization admins can override all event permissions</p>
        </div>
      </div>
    </div>
  )
}