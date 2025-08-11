'use client'

import { useParams } from 'next/navigation'
import EventDashboard from '@/components/events/EventDashboard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function EventPage() {
  const params = useParams()
  const eventId = params.id as string

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <EventDashboard eventId={eventId} />
        </div>
      </div>
    </ProtectedRoute>
  )
}