'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Decode JWT token to get claims
function decodeToken(token: string): { sub: string; is_admin: boolean; exp: number } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('[v0] Failed to decode token:', error)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const checkAuth = () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      const decoded = decodeToken(token)
      console.log('[Auth] Decoded token:', decoded)
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setIsAuthenticated(true)
        setIsAdmin(decoded.is_admin || false)
        console.log('[Auth] User authenticated. isAdmin:', decoded.is_admin)
      } else {
        // Token expired, try to refresh
        console.log('[Auth] Token expired, attempting refresh')
        refreshAuth()
      }
    } else {
      console.log('[Auth] No access token found')
      setIsAuthenticated(false)
      setIsAdmin(false)
    }
    setIsLoading(false)
  }

  const refreshAuth = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      localStorage.removeItem('access_token')
      setIsAuthenticated(false)
      setIsAdmin(false)
      return
    }

    try {
      const response = await apiClient.refreshToken(refreshToken)
      localStorage.setItem('access_token', response.access_token)
      // Update refresh token if provided
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token)
      }
      const decoded = decodeToken(response.access_token)
      if (decoded) {
        setIsAuthenticated(true)
        setIsAdmin(decoded.is_admin || false)
      }
    } catch (error) {
      console.error('[v0] Failed to refresh token:', error)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setIsAuthenticated(false)
      setIsAdmin(false)
    }
  }

  const login = async () => {
    try {
      const response = await apiClient.getDiscordLoginUrl()
      window.location.href = response.authorization_url
    } catch (error) {
      console.error('[v0] Failed to get login URL:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('[v0] Logout error:', error)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setIsAuthenticated(false)
      setIsAdmin(false)
      router.push('/login')
    }
  }

  useEffect(() => {
    checkAuth()

    // Listen for storage events (token updates from other tabs or from api.ts refresh)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'refresh_token') {
        console.log('[Auth] Token updated in storage, re-checking auth...')
        checkAuth()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom events dispatched by api.ts when it refreshes tokens
    const handleTokenRefresh = () => {
      console.log('[Auth] Token refresh event received, re-checking auth...')
      checkAuth()
    }
    window.addEventListener('tokenRefreshed', handleTokenRefresh)

    // Set up periodic token expiration check (every minute)
    const intervalId = setInterval(() => {
      const token = localStorage.getItem('access_token')
      if (token) {
        const decoded = decodeToken(token)
        if (decoded) {
          const timeUntilExpiry = decoded.exp * 1000 - Date.now()
          const fiveMinutes = 5 * 60 * 1000

          // If token expires in less than 5 minutes, proactively refresh it
          if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
            console.log('[Auth] Token expiring soon, refreshing proactively...')
            refreshAuth()
          } else if (timeUntilExpiry <= 0) {
            // Token already expired
            console.log('[Auth] Token expired, attempting refresh...')
            refreshAuth()
          }
        }
      }
    }, 60 * 1000) // Check every minute

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('tokenRefreshed', handleTokenRefresh)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
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
