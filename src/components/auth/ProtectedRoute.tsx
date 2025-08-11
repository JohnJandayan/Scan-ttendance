'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include',
        })

        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Auth verification failed:', error)
        setIsAuthenticated(false)
        router.push('/auth/signin')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying authentication...</p>
          </div>
        </div>
      )
    )
  }

  if (!isAuthenticated) {
    return null // Router will handle redirect
  }

  return <>{children}</>
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute fallback={fallback}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}