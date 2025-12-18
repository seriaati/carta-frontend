"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    console.log('[AdminProtectedRoute] Auth state:', { isLoading, isAuthenticated, isAdmin, hasRedirected })
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        console.log('[AdminProtectedRoute] Not authenticated, redirecting to login')
        setHasRedirected(true)
        router.push("/login")
      } else if (!isAdmin) {
        // Authenticated but not admin, redirect to unauthorized page
        console.log('[AdminProtectedRoute] Not admin, redirecting to unauthorized')
        setHasRedirected(true)
        router.push("/unauthorized")
      } else {
        console.log('[AdminProtectedRoute] User is authenticated and admin, allowing access')
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router])

  // Always show loading spinner until we've confirmed admin status
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // If redirecting or not authorized, show loading spinner instead of rendering children
  if (!isAuthenticated || !isAdmin || hasRedirected) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Only render children if authenticated AND admin AND haven't redirected
  return <>{children}</>
}
