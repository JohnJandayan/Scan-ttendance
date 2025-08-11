'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import EventCreation from '@/components/events/EventCreation'

export default function CreateEventPage() {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get user info from token verification
    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify')
        if (!response.ok) {
          throw new Error('Authentication required')
        }

        const result = await response.json()
        if (!result.success) {
          throw new Error('Authentication failed')
        }

        setOrganizationId(result.data.user.organizationId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed')
        // Redirect to login
        router.push('/auth/signin')
      } finally {
        setLoading(false)
      }
    }

    verifyAuth()
  }, [router])

  const handleEventCreated = (eventId: string) => {
    // Redirect to event dashboard
    router.push(`/events/${eventId}`)
  }

  const handleCancel = () => {
    // Go back to dashboard
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EventCreation
        organizationId={organizationId}
        onEventCreated={handleEventCreated}
        onCancel={handleCancel}
      />
    </div>
  )
}