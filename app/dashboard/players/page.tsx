"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { apiClient, type Player } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Loader2, Plus, Minus, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Currency adjustment form component
function CurrencyAdjustmentForm({
  player,
  onSuccess,
  onCancel,
}: {
  player: Player
  onSuccess: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [operationType, setOperationType] = useState<"increase" | "decrease" | "set">("increase")
  const [amount, setAmount] = useState<string>("")
  const [reason, setReason] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const numAmount = Number.parseInt(amount, 10)

      if (isNaN(numAmount)) {
        toast({
          variant: "destructive",
          title: "錯誤",
          description: "請輸入有效的數字",
        })
        setIsLoading(false)
        return
      }

      if (!reason.trim()) {
        toast({
          variant: "destructive",
          title: "錯誤",
          description: "請輸入調整原因",
        })
        setIsLoading(false)
        return
      }

      if (operationType === "increase" || operationType === "decrease") {
        if (numAmount <= 0) {
          toast({
            variant: "destructive",
            title: "錯誤",
            description: "金額必須大於 0",
          })
          setIsLoading(false)
          return
        }

        if (operationType === "increase") {
          await apiClient.increaseCurrency(player.id, { amount: numAmount, reason })
          toast({
            title: "成功",
            description: `已增加 ${numAmount} 貨幣`,
          })
        } else {
          await apiClient.decreaseCurrency(player.id, { amount: numAmount, reason })
          toast({
            title: "成功",
            description: `已減少 ${numAmount} 貨幣`,
          })
        }
      } else {
        if (numAmount < 0) {
          toast({
            variant: "destructive",
            title: "錯誤",
            description: "金額不能為負數",
          })
          setIsLoading(false)
          return
        }

        await apiClient.setCurrency(player.id, { amount: numAmount, reason })
        toast({
          title: "成功",
          description: `已設定貨幣為 ${numAmount}`,
        })
      }

      onSuccess()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "錯誤",
        description: error instanceof Error ? error.message : "操作失敗",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>當前玩家</Label>
        <div className="p-3 bg-muted rounded-md">
          <div className="font-medium">{player.username}</div>
          <div className="text-sm text-muted-foreground">當前貨幣: {player.currency}</div>
        </div>
      </div>

      <Tabs value={operationType} onValueChange={(v) => setOperationType(v as typeof operationType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="increase">增加</TabsTrigger>
          <TabsTrigger value="decrease">減少</TabsTrigger>
          <TabsTrigger value="set">設定</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <Label htmlFor="amount">
          {operationType === "set" ? "設定金額" : "調整金額"}
        </Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={operationType === "set" ? "輸入要設定的金額" : "輸入要調整的金額"}
          required
          min={operationType === "set" ? 0 : 1}
        />
        {operationType === "set" && (
          <p className="text-sm text-muted-foreground">
            將玩家貨幣設定為指定金額
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">原因</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="輸入調整原因 (用於記錄)"
          required
          maxLength={255}
          rows={3}
        />
        <p className="text-sm text-muted-foreground">
          {reason.length}/255 字元
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          確認
        </Button>
      </div>
    </form>
  )
}

export default function PlayersPage() {
  const { toast } = useToast()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const loadPlayers = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getPlayers(currentPage, 20, {
        search_username: debouncedSearchTerm || undefined,
      })
      setPlayers(response.data)
      setTotalPages(response.pagination.total_pages)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "錯誤",
        description: error instanceof Error ? error.message : "載入玩家列表失敗",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlayers()
  }, [currentPage, debouncedSearchTerm])

  const handleCurrencyAdjustSuccess = () => {
    setIsDialogOpen(false)
    setSelectedPlayer(null)
    loadPlayers()
  }

  const openCurrencyDialog = (player: Player) => {
    setSelectedPlayer(player)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">玩家管理</h1>
          <p className="text-muted-foreground">管理玩家資料與貨幣</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋玩家名稱..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-8"
          />
        </div>
      </div>

      {/* Players table */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Discord ID</TableHead>
                  <TableHead>玩家名稱</TableHead>
                  <TableHead>貨幣</TableHead>
                  <TableHead>建立時間</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      沒有找到玩家
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-mono text-sm">{player.id}</TableCell>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell className="font-bold">{player.currency}</TableCell>
                      <TableCell>{new Date(player.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCurrencyDialog(player)}
                        >
                          <Settings className="mr-1 h-4 w-4" />
                          管理貨幣
                        </Button>
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
              第 {currentPage} 頁，共 {totalPages} 頁
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                上一頁
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                下一頁
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Currency adjustment dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>管理玩家貨幣</DialogTitle>
          </DialogHeader>
          {selectedPlayer && (
            <CurrencyAdjustmentForm
              player={selectedPlayer}
              onSuccess={handleCurrencyAdjustSuccess}
              onCancel={() => {
                setIsDialogOpen(false)
                setSelectedPlayer(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
