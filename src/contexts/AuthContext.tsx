'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  organizationId: string
  organizationName: string
  role?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
  getSchemaName: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const getSchemaName = () => {
    if (!user) return null
    return `org_${user.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')}`
  }

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success && data.data.isValid) {
        setUser({
          id: data.data.user.id,
          email: data.data.user.email,
          organizationId: data.data.user.organizationId,
          organizationName: data.data.user.organizationName || '',
          role: data.data.user.role
        })
      } else {
        setUser(null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        const { user: userData, tokens } = data.data
        
        setUser({
          id: userData.id,
          email: userData.email,
          organizationId: userData.organizationId,
          organizationName: userData.organizationName,
          role: userData.role
        })

        localStorage.setItem('accessToken', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)

        return true
      }

      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    
    // Call logout endpoint to invalidate server-side session
    fetch('/api/auth/logout', {
      method: 'POST'
    }).catch(console.error)
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    getSchemaName
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}