'use client'

import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import ErrorBoundary from '@/components/error/ErrorBoundary'
// Import service worker manager conditionally to avoid SSR issues

interface AppLayoutProps {
  children: React.ReactNode
  showHeader?: boolean
  showFooter?: boolean
}

export default function AppLayout({ 
  children, 
  showHeader = true, 
  showFooter = true 
}: AppLayoutProps) {
  // Register service worker on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Dynamically import service worker manager to avoid SSR issues
      import('@/lib/service-worker').then(({ serviceWorkerManager }) => {
        serviceWorkerManager.register()
        serviceWorkerManager.requestNotificationPermission()
      }).catch(console.error)
    }
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        {showHeader && <Header />}
        <main className="flex-grow">
          {children}
        </main>
        {showFooter && <Footer />}
      </div>
    </ErrorBoundary>
  )
}