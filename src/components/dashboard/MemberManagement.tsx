'use client'

import { useState, useEffect } from 'react'
import { Member, MemberCreate } from '@/types'

interface MemberManagementProps {
  organizationId: string
  currentUserRole?: string
}

export default function MemberManagement({ 
  organizationId, 
  currentUserRole = 'admin' 
}: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState<MemberCreate>({
    name: '',
    email: '',
    role: 'viewer'
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [organizationId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/org/members')
      if (!response.ok) {
        throw new Error('Failed to load members')
      }

      const data = await response.json()
      if (data.success) {
        const membersData = data.data || []
        setMembers(Array.isArray(membersData) ? membersData : [])
      } else {
        throw new Error(data.error?.message || 'Failed to load members')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canManageMembers()) {
      setError('You do not have permission to add members')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/org/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to add member')
      }

      // Add new member to list
      setMembers(prev => [...prev, data.data])
      
      // Reset form
      setFormData({ name: '', email: '', role: 'viewer' })
      setShowAddForm(false)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingMember || !canManageMembers()) {
      setError('You do not have permission to edit members')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/org/members/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update member')
      }

      // Update member in list
      setMembers(prev => prev.map(member => 
        member.id === editingMember.id ? data.data : member
      ))
      
      // Reset form
      setFormData({ name: '', email: '', role: 'viewer' })
      setEditingMember(null)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!canManageMembers()) {
      setError('You do not have permission to delete members')
      return
    }

    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }

    try {
      setError(null)

      const response = await fetch(`/api/org/members/${memberId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to delete member')
      }

      // Remove member from list
      setMembers(prev => prev.filter(member => member.id !== memberId))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete member')
    }
  }

  const startEdit = (member: Member) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role
    })
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingMember(null)
    setFormData({ name: '', email: '', role: 'viewer' })
  }

  const canManageMembers = () => {
    return currentUserRole === 'admin' || currentUserRole === 'manager'
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'manager':
        return 'bg-yellow-100 text-yellow-800'
      case 'viewer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Organization Members</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage team members and their access levels
          </p>
        </div>
        {canManageMembers() && (
          <button
            onClick={() => {
              setShowAddForm(true)
              setEditingMember(null)
              setFormData({ name: '', email: '', role: 'viewer' })
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Add/Edit Member Form */}
      {(showAddForm || editingMember) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingMember ? 'Edit Member' : 'Add New Member'}
          </h3>
          
          <form onSubmit={editingMember ? handleEditMember : handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'manager' | 'viewer' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="viewer">Viewer - Can view events and attendance</option>
                <option value="manager">Manager - Can create and manage events</option>
                <option value="admin">Admin - Full access to organization</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  cancelEdit()
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-md font-medium transition-colors flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingMember ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingMember ? 'Update Member' : 'Add Member'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {members.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No members yet</h3>
            <p className="mt-1 text-sm text-gray-500">Add team members to help manage events.</p>
            {canManageMembers() && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Add First Member
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  {canManageMembers() && (
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    {canManageMembers() && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => startEdit(member)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Statistics */}
      {members.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {members.filter(m => m.role === 'admin').length}
              </div>
              <div className="text-sm text-gray-600">Administrators</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {members.filter(m => m.role === 'manager').length}
              </div>
              <div className="text-sm text-gray-600">Managers</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {members.filter(m => m.role === 'viewer').length}
              </div>
              <div className="text-sm text-gray-600">Viewers</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}