"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiRequest } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      setError("Missing code or state parameters")
      return
    }

    const exchangeToken = async () => {
      try {
        const data = await apiRequest<{ access_token: string; refresh_token?: string }>(
          `/api/auth/discord/callback?code=${code}&state=${state}`,
        )

        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token)
          // Store refresh token if provided
          if (data.refresh_token) {
            localStorage.setItem("refresh_token", data.refresh_token)
          }
          window.location.href = "/dashboard"
        } else {
          setError("No access token received")
        }
      } catch (err: any) {
        setError(err.message || "Failed to exchange token")
      }
    }

    exchangeToken()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="text-red-500 font-medium">Authentication Error: {error}</div>
        <button onClick={() => router.push("/login")} className="text-blue-500 hover:underline">
          Back to Login
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Authenticating...</p>
    </div>
  )
}
