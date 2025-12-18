"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { apiClient, type CardPool } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Settings, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

function PoolForm({
  initialData,
  onSuccess,
  onCancel,
}: {
  initialData?: CardPool
  onSuccess: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (initialData) {
        await apiClient.updateCardPool(initialData.id, formData)
        toast({
          title: "成功",
          description: "卡池更新成功",
        })
      } else {
        await apiClient.createCardPool(formData)
        toast({
          title: "成功",
          description: "卡池建立成功",
        })
      }
      onSuccess()
    } catch (error) {
      console.error("Failed to save card pool:", error)
      const errorMessage = error instanceof Error ? error.message : "儲存卡池失敗"
      toast({
        variant: "destructive",
        title: "錯誤",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            名稱
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="col-span-3"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {initialData ? "更新卡池" : "建立卡池"}
        </Button>
      </div>
    </form>
  )
}

export default function PoolsPage() {
  const { toast } = useToast()
  const [pools, setPools] = useState<CardPool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPool, setEditingPool] = useState<CardPool | undefined>(undefined)
  const router = useRouter()

  const fetchPools = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getCardPools(page, 20)
      setPools(response.data)
      setTotalPages(response.pagination.total_pages)
    } catch (error) {
      console.error("Failed to fetch pools:", error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "無法載入卡池列表",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPools()
  }, [page])

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這個卡池嗎？")) return

    try {
      await apiClient.deleteCardPool(id)
      toast({
        title: "成功",
        description: "卡池已刪除",
      })
      fetchPools()
    } catch (error) {
      console.error("Failed to delete pool:", error)
      const errorMessage = error instanceof Error ? error.message : "刪除卡池失敗"
      toast({
        variant: "destructive",
        title: "錯誤",
        description: errorMessage,
      })
    }
  }

  const handleEdit = (pool: CardPool) => {
    setEditingPool(pool)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingPool(undefined)
    setIsDialogOpen(true)
  }

  const handleSuccess = () => {
    setIsDialogOpen(false)
    fetchPools()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">卡池列表</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 size-4" />
              新增卡池
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPool ? "編輯卡池" : "建立新卡池"}</DialogTitle>
            </DialogHeader>
            <PoolForm initialData={editingPool} onSuccess={handleSuccess} onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名稱</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : pools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                  找不到卡池。
                </TableCell>
              </TableRow>
            ) : (
              pools.map((pool) => (
                <TableRow key={pool.id}>
                  <TableCell className="font-medium">{pool.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/pools/${pool.id}`)}>
                        <Settings className="mr-2 size-4" />
                        管理卡牌
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(pool)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(pool.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
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
  )
}
