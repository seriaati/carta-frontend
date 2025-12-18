"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { apiClient, type EventLog, type EventType } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Filter, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

// Event type labels in Traditional Chinese
const eventTypeLabels: Record<EventType, string> = {
  EARN_MONEY: "獲得金錢",
  SPEND_MONEY: "消費金錢",
  ADMIN_INCREASE_CURRENCY: "管理員增加貨幣",
  ADMIN_DECREASE_CURRENCY: "管理員減少貨幣",
  ADMIN_SET_CURRENCY: "管理員設定貨幣",
  OBTAIN_CARD: "獲得卡牌",
  SELL_CARD: "出售卡牌",
  GACHA_PULL: "抽卡",
  TRADE_CREATED: "創建交易",
  TRADE_ACCEPTED: "接受交易",
  TRADE_REJECTED: "拒絕交易",
  TRADE_CANCELLED: "取消交易",
  TRADE_CARD_SENT: "交易送出卡牌",
  TRADE_CARD_RECEIVED: "交易收到卡牌",
  TRADE_MONEY_SENT: "交易送出金錢",
  TRADE_MONEY_RECEIVED: "交易收到金錢",
  RANKED_SCORE_GAINED: "排位積分增加",
  RANKED_SCORE_LOST: "排位積分減少",
  RANKED_WEEKLY_REWARD: "週排位獎勵",
  RANKED_PLAY_FEE: "排位遊戲費用",
}

// Helper function to get badge color based on event type
const getEventTypeBadgeColor = (eventType: EventType) => {
  if (["EARN_MONEY", "ADMIN_INCREASE_CURRENCY"].includes(eventType)) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  }
  if (["SPEND_MONEY", "ADMIN_DECREASE_CURRENCY"].includes(eventType)) {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  }
  if (["OBTAIN_CARD", "GACHA_PULL"].includes(eventType)) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  }
  if (["TRADE_ACCEPTED", "RANKED_SCORE_GAINED"].includes(eventType)) {
    return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
  }
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
}

// Format event context for display
const formatContext = (log: EventLog): string => {
  const ctx = log.context
  switch (log.event_type) {
    case "EARN_MONEY":
    case "SPEND_MONEY":
      return `金額: ${ctx.amount}, 原因: ${ctx.reason}`
    case "ADMIN_INCREASE_CURRENCY":
    case "ADMIN_DECREASE_CURRENCY":
    case "ADMIN_SET_CURRENCY":
      return `金額: ${ctx.amount}, 原因: ${ctx.reason}`
    case "OBTAIN_CARD":
      return `卡牌ID: ${ctx.card_id}, 來源: ${ctx.source}`
    case "SELL_CARD":
      return `卡牌: ${ctx.card_name}, 數量: ${ctx.quantity}, 價格: ${ctx.unit_price}`
    case "GACHA_PULL":
      return `卡牌ID: ${ctx.card_id}, 卡池ID: ${ctx.pool_id}, 保底: ${ctx.was_pity ? '是' : '否'}`
    case "TRADE_CREATED":
      return `交易ID: ${ctx.trade_id}, 接收者: ${ctx.receiver_id}`
    case "TRADE_ACCEPTED":
    case "TRADE_REJECTED":
      return `交易ID: ${ctx.trade_id}, 提議者: ${ctx.proposer_id}`
    case "TRADE_CANCELLED":
      return `交易ID: ${ctx.trade_id}, 接收者: ${ctx.receiver_id}`
    case "TRADE_CARD_SENT":
    case "TRADE_CARD_RECEIVED":
      return `交易ID: ${ctx.trade_id}, 卡牌ID: ${ctx.card_id}`
    case "TRADE_MONEY_SENT":
    case "TRADE_MONEY_RECEIVED":
      return `交易ID: ${ctx.trade_id}, 金額: ${ctx.amount}`
    case "RANKED_SCORE_GAINED":
      return `積分: +${ctx.score_gained}, 新積分: ${ctx.new_score}`
    case "RANKED_SCORE_LOST":
      return `積分: -${ctx.score_lost}, 新積分: ${ctx.new_score}`
    case "RANKED_WEEKLY_REWARD":
      return `排名: ${ctx.rank}, 獎勵: ${ctx.reward}, 週次: ${ctx.week}`
    case "RANKED_PLAY_FEE":
      return `費用: ${ctx.fee}, 遊玩次數: ${ctx.plays}`
    default:
      return JSON.stringify(ctx)
  }
}

function EventLogDetailDialog({ log }: { log: EventLog }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>事件記錄詳情 #{log.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold">ID</Label>
            <div className="col-span-3">{log.id}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold">玩家名稱</Label>
            <div className="col-span-3 font-medium">{log.player_name}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold">玩家ID</Label>
            <div className="col-span-3 font-mono text-sm">{log.player_id}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold">事件類型</Label>
            <div className="col-span-3">
              <Badge className={getEventTypeBadgeColor(log.event_type)}>
                {eventTypeLabels[log.event_type]}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right font-bold">內容</Label>
            <div className="col-span-3">
              <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
                {JSON.stringify(log.context, null, 2)}
              </pre>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold">建立時間</Label>
            <div className="col-span-3">{new Date(log.created_at).toLocaleString('zh-TW')}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-bold">更新時間</Label>
            <div className="col-span-3">{new Date(log.updated_at).toLocaleString('zh-TW')}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function EventLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<EventLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filters
  const [playerSearch, setPlayerSearch] = useState("")
  const [selectedEventType, setSelectedEventType] = useState<EventType | "ALL">("ALL")

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      // Build filter options
      const options: {
        player_name?: string
        event_type?: EventType
      } = {}

      if (playerSearch) {
        options.player_name = playerSearch
      }
      if (selectedEventType !== "ALL") {
        options.event_type = selectedEventType
      }

      const response = await apiClient.getEventLogs(page, 20, options)
      setLogs(response.data)
      setTotalPages(response.pagination.total_pages)
      setTotalItems(response.pagination.total_items)
    } catch (error) {
      console.error("Failed to fetch event logs:", error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "無法載入事件記錄列表",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Reset to page 1 when filters change
    if (page !== 1) {
      setPage(1)
    } else {
      fetchLogs()
    }
  }, [playerSearch, selectedEventType])

  useEffect(() => {
    fetchLogs()
  }, [page])

  const handleClearFilters = () => {
    setPlayerSearch("")
    setSelectedEventType("ALL")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">事件記錄</h1>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="size-4" />
          <h2 className="font-semibold">篩選條件</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>玩家搜尋</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="輸入玩家名稱或ID..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>事件類型</Label>
            <Select value={selectedEventType} onValueChange={(value) => setSelectedEventType(value as EventType | "ALL")}>
              <SelectTrigger>
                <SelectValue placeholder="選擇事件類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                {(Object.keys(eventTypeLabels) as EventType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {eventTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            清除篩選
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>玩家</TableHead>
              <TableHead>事件類型</TableHead>
              <TableHead>摘要</TableHead>
              <TableHead>建立時間</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  找不到事件記錄。
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{log.player_name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{log.player_id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getEventTypeBadgeColor(log.event_type)}>
                      {eventTypeLabels[log.event_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">{formatContext(log)}</TableCell>
                  <TableCell>{new Date(log.created_at).toLocaleString('zh-TW')}</TableCell>
                  <TableCell className="text-right">
                    <EventLogDetailDialog log={log} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          共 {totalItems} 筆記錄
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            上一頁
          </Button>
          <div className="text-sm font-medium">
            頁次 {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            下一頁
          </Button>
        </div>
      </div>
    </div>
  )
}
