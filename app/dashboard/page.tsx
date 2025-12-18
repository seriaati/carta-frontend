"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Library,
  Layers,
  ShoppingBag,
  Users,
  TrendingUp,
  Swords,
  Package,
  Layers2
} from "lucide-react"
import { apiClient, DashboardStats } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { isAdmin, isLoading: authLoading } = useAuth()

  useEffect(() => {
    // Don't fetch if still checking auth or user is not admin
    if (authLoading || !isAdmin) {
      return
    }

    const fetchStats = async () => {
      try {
        const response = await apiClient.getDashboardStats()
        setStats(response.data)
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isAdmin, authLoading])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">儀表板</h1>
        <p className="text-muted-foreground">歡迎來到 TCG 管理後台。請在此管理您的遊戲資產。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總玩家數</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_players.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">註冊玩家總數</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">卡牌總數</CardTitle>
            <Library className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_cards.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">遊戲中的卡牌種類</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">卡池數量</CardTitle>
            <Layers className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_card_pools.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">可用卡池總數</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">商店商品</CardTitle>
            <ShoppingBag className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_shop_items.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">商店中的商品數量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">交易總數</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_trades.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">
              活躍交易: {stats?.active_trades.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PVP 挑戰</CardTitle>
            <Swords className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_pvp_challenges.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">
              進行中: {stats?.active_pvp_challenges.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">背包物品</CardTitle>
            <Package className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_inventory_items.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">玩家背包中的物品</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">牌組卡牌</CardTitle>
            <Layers2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_deck_cards.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">玩家牌組中的卡牌</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
