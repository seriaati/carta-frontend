"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export default function UnauthorizedPage() {
  const { logout } = useAuth()

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <ShieldAlert className="size-16 text-destructive" />
      <h1 className="text-2xl font-bold">未經授權</h1>
      <p className="text-muted-foreground">您沒有權限訪問管理面板</p>
      <p className="text-sm text-muted-foreground">只有管理員可以訪問此區域</p>
      <div className="flex gap-2 mt-4">
        <Button onClick={logout} variant="outline">
          登出
        </Button>
      </div>
    </div>
  )
}
