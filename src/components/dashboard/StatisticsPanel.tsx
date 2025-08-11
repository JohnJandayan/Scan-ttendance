'use client'

import { useEffect, useState } from 'react'

interface DashboardStats {
  activeEvents: number
  archivedEvents: number
  totalMembers: number
  recentScans: number
  totalAttendance: number
}

interface StatisticsPanelProps {
  stats: DashboardStats
}

interface StatCard {
  title: string
  value: number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: React.ReactNode
  color: string
  description: string
}

export default function StatisticsPanel({ stats }: StatisticsPanelProps) {
  const [animatedStats, setAnimatedStats] = useState<DashboardStats>({
    activeEvents: 0,
    archivedEvents: 0,
    totalMembers: 0,
    recentScans: 0,
    totalAttendance: 0
  })

  // Animate numbers on load
  useEffect(() => {
    const duration = 1000 // 1 second
    const steps = 60
    const stepDuration = duration / steps

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setAnimatedStats({
        activeEvents: Math.floor(stats.activeEvents * progress),
        archivedEvents: Math.floor(stats.archivedEvents * progress),
        totalMembers: Math.floor(stats.totalMembers * progress),
        recentScans: Math.floor(stats.recentScans * progress),
        totalAttendance: Math.floor(stats.totalAttendance * progress)
      })

      if (currentStep >= steps) {
        clearInterval(interval)
        setAnimatedStats(stats)
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [stats])

  const statCards: StatCard[] = [
    {
      title: 'Active Events',
      value: animatedStats.activeEvents,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-4h8v4z" />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-100',
      description: 'Currently running events'
    },
    {
      title: 'Total Members',
      value: animatedStats.totalMembers,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'text-green-600 bg-green-100',
      description: 'Organization members'
    },
    {
      title: 'Recent Scans',
      value: animatedStats.recentScans,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-100',
      description: 'QR scans today'
    },
    {
      title: 'Total Attendance',
      value: animatedStats.totalAttendance,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-indigo-600 bg-indigo-100',
      description: 'All-time verified attendees'
    },
    {
      title: 'Archived Events',
      value: animatedStats.archivedEvents,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      color: 'text-gray-600 bg-gray-100',
      description: 'Completed events'
    }
  ]

  const getChangeIndicator = (change?: number, changeType?: 'increase' | 'decrease' | 'neutral') => {
    if (!change || !changeType) return null

    const isPositive = changeType === 'increase'
    const colorClass = isPositive ? 'text-green-600' : changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
    const icon = isPositive ? '↗' : changeType === 'decrease' ? '↘' : '→'

    return (
      <div className={`flex items-center text-sm ${colorClass} mt-1`}>
        <span className="mr-1">{icon}</span>
        <span>{Math.abs(change)}%</span>
        <span className="text-gray-500 ml-1">vs last month</span>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card, index) => (
          <div
            key={card.title}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {card.description}
                </p>
                {getChangeIndicator(card.change, card.changeType)}
              </div>
              <div className={`p-3 rounded-full ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.activeEvents > 0 ? Math.round((stats.totalAttendance / stats.activeEvents) * 100) / 100 : 0}
            </div>
            <div className="text-sm text-gray-600">Avg. attendance per event</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.totalMembers > 1 ? ((stats.totalMembers - 1) / stats.totalMembers * 100).toFixed(0) : 0}%
            </div>
            <div className="text-sm text-gray-600">Team member ratio</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {stats.recentScans}
            </div>
            <div className="text-sm text-gray-600">Scans in last 24h</div>
          </div>
        </div>
      </div>
    </div>
  )
}