'use client'

import { useState, useEffect } from 'react'
import { Event, Member } from '@/types'
import EventCard from './EventCard'
import StatisticsPanel from './StatisticsPanel'
import MemberManagement from './MemberManagement'
import ArchivedEventsList from '../events/ArchivedEventsList'
import styles from '@/styles/responsive.module.css'

interface DashboardStats {
  activeEvents: number
  archivedEvents: number
  totalMembers: number
  recentScans: number
  totalAttendance: number
}

interface OrganizationDashboardProps {
  organizationName: string
  organizationId: string
}

export default function OrganizationDashboard({ 
  organizationName, 
  organizationId 
}: OrganizationDashboardProps) {
  const [activeEvents, setActiveEvents] = useState<Event[]>([])
  const [archivedEvents, setArchivedEvents] = useState<Event[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    activeEvents: 0,
    archivedEvents: 0,
    totalMembers: 0,
    recentScans: 0,
    totalAttendance: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ongoing' | 'archived' | 'members'>('ongoing')

  useEffect(() => {
    loadDashboardData()
  }, [organizationId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load events, members, and statistics
      const [eventsResponse, membersResponse, statsResponse] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/org/members'),
        fetch('/api/org/stats')
      ])

      if (!eventsResponse.ok || !membersResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const eventsData = await eventsResponse.json()
      const membersData = await membersResponse.json()
      const statsData = await statsResponse.json()

      if (eventsData.success) {
        const events = eventsData.data || []
        setActiveEvents(events.filter((event: Event) => event.isActive))
        setArchivedEvents(events.filter((event: Event) => !event.isActive))
      }

      if (membersData.success) {
        setMembers(membersData.data || [])
      }

      if (statsData.success) {
        setStats(statsData.data || stats)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = () => {
    // Navigate to event creation page
    window.location.href = '/events/create'
  }

  const handleManageMembers = () => {
    setActiveTab('members')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            onClick={loadDashboardData}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-area-top safe-area-bottom">
      <div className={`${styles.container} max-w-7xl mx-auto py-6 md:py-8`}>
        {/* Header */}
        <div className={`${styles.responsiveSpacing} mb-6 md:mb-8`}>
          <h1 className={`${styles.responsiveHeading} text-gray-900 truncate`}>
            {organizationName} Dashboard
          </h1>
          <p className="mt-2 text-base md:text-lg text-gray-600">
            Manage your events, members, and track attendance
          </p>
        </div>

        {/* Statistics Panel */}
        <div className="mb-6 md:mb-8">
          <StatisticsPanel stats={stats} />
        </div>

        {/* Quick Actions */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row gap-3 md:gap-4">
          <button
            onClick={handleCreateEvent}
            className={`${styles.touchButton} bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md flex-1 sm:flex-none`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Event
          </button>
          <button
            onClick={handleManageMembers}
            className={`${styles.touchButton} bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md flex-1 sm:flex-none`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Manage Members
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4 md:space-x-8 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`${styles.touchTarget} py-3 px-2 border-b-2 font-medium text-sm md:text-base whitespace-nowrap transition-colors duration-200 ${
                activeTab === 'ongoing'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ongoing Events ({activeEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`${styles.touchTarget} py-3 px-2 border-b-2 font-medium text-sm md:text-base whitespace-nowrap transition-colors duration-200 ${
                activeTab === 'archived'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Archived Events ({archivedEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`${styles.touchTarget} py-3 px-2 border-b-2 font-medium text-sm md:text-base whitespace-nowrap transition-colors duration-200 ${
                activeTab === 'members'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Members ({members.length})
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className={`${styles.mobileCard} bg-white rounded-lg shadow-sm`}>
          {activeTab === 'ongoing' && (
            <div className={styles.responsivePadding}>
              <h2 className={`${styles.responsiveSubheading} text-gray-900 mb-4 md:mb-6`}>
                Ongoing Events
              </h2>
              {activeEvents.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <svg className="mx-auto h-12 w-12 md:h-16 md:w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-4h8v4z" />
                  </svg>
                  <h3 className="mt-4 text-base md:text-lg font-medium text-gray-900">No ongoing events</h3>
                  <p className="mt-2 text-sm md:text-base text-gray-500">Get started by creating your first event.</p>
                  <div className="mt-6">
                    <button
                      onClick={handleCreateEvent}
                      className={`${styles.touchButton} bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md`}
                    >
                      Create Event
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`${styles.eventCardGrid}`}>
                  {activeEvents.map((event) => (
                    <EventCard key={event.id} event={event} type="ongoing" />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'archived' && (
            <div className={styles.responsivePadding}>
              <ArchivedEventsList organizationId={organizationId} />
            </div>
          )}

          {activeTab === 'members' && (
            <div className={styles.responsivePadding}>
              <MemberManagement 
                organizationId={organizationId}
                currentUserRole="admin"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}