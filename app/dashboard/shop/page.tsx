"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { apiClient, type ShopItem, type Card } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Loader2, ChevronsUpDown, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

// Helper function to translate item type to Traditional Chinese
const getItemTypeLabel = (type: string) => {
  switch (type) {
    case "CARD":
      return "卡牌"
    case "ITEM":
      return "道具"
    default:
      return type
  }
}

function ShopItemForm({
  initialData,
  onSuccess,
  onCancel,
}: {
  initialData?: ShopItem
  onSuccess: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    price: initialData?.price || 0,
    rate: initialData?.rate || 0,
    type: initialData?.type || "ITEM",
    card_id: initialData?.card_id || (null as number | null),
  })

  // For card selection
  const [availableCards, setAvailableCards] = useState<Card[]>([])
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const [cardSearch, setCardSearch] = useState("")
  const debouncedCardSearch = useDebounce(cardSearch, 300)
  const [shopRarities, setShopRarities] = useState<Record<string, number>>({})

  useEffect(() => {
    const searchCards = async () => {
      try {
        const response = await apiClient.getCards(1, 50)
        setAvailableCards(response.data)
      } catch (error) {
        console.error("Failed to search cards:", error)
      }
    }
    searchCards()
  }, [debouncedCardSearch])

  useEffect(() => {
    const fetchShopRarities = async () => {
      try {
        const response = await apiClient.getShopRarities()
        setShopRarities(response.data)
      } catch (error) {
        console.error("Failed to fetch shop rarities:", error)
      }
    }
    fetchShopRarities()
  }, [])

  // Auto-populate rate from settings when card is selected for CARD type items
  useEffect(() => {
    if (formData.type === "CARD" && formData.card_id) {
      const selectedCard = availableCards.find((card) => card.id === formData.card_id)
      if (selectedCard && shopRarities[selectedCard.rarity]) {
        setFormData((prev) => ({ ...prev, rate: shopRarities[selectedCard.rarity] }))
      }
    }
  }, [formData.type, formData.card_id, availableCards, shopRarities])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // If type is ITEM, clear card_id
      const payload = {
        ...formData,
        card_id: formData.type === "CARD" ? formData.card_id : null,
      }

      if (initialData) {
        await apiClient.updateShopItem(initialData.id, payload)
        toast({
          title: "成功",
          description: "商店商品更新成功",
        })
      } else {
        await apiClient.createShopItem(payload)
        toast({
          title: "成功",
          description: "商店商品建立成功",
        })
      }
      onSuccess()
    } catch (error) {
      console.error("Failed to save shop item:", error)
      const errorMessage = error instanceof Error ? error.message : "儲存商店商品失敗"
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

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="price" className="text-right">
            價格
          </Label>
          <Input
            id="price"
            type="number"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number.parseInt(e.target.value) || 0 })}
            className="col-span-3"
            required
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="rate" className="text-right">
            出現機率 {formData.type === "CARD" && <span className="text-xs text-muted-foreground">(自動)</span>}
          </Label>
          <Input
            id="rate"
            type="number"
            min="0"
            step="0.01"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: Number.parseFloat(e.target.value) || 0 })}
            className="col-span-3"
            disabled={formData.type === "CARD"}
            required={formData.type === "ITEM"}
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="type" className="text-right">
            類型
          </Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="選擇類型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ITEM">道具</SelectItem>
              <SelectItem value="CARD">卡牌</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.type === "CARD" && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">卡牌</Label>
            <div className="col-span-3">
              <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isComboboxOpen}
                    className="w-full justify-between bg-transparent"
                  >
                    {formData.card_id
                      ? availableCards.find((card) => card.id === formData.card_id)?.name ||
                        (initialData?.card ? initialData.card.name : "選擇卡牌...")
                      : "選擇卡牌..."}
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="搜尋卡牌..." onValueChange={setCardSearch} />
                    <CommandList>
                      <CommandEmpty>找不到卡牌。</CommandEmpty>
                      <CommandGroup>
                        {availableCards.map((card) => (
                          <CommandItem
                            key={card.id}
                            value={card.name}
                            onSelect={() => {
                              setFormData({ ...formData, card_id: card.id })
                              setIsComboboxOpen(false)
                            }}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4", formData.card_id === card.id ? "opacity-100" : "opacity-0")}
                            />
                            <span className="flex items-center gap-2">
                              {card.image_url && (
                                <img
                                  src={card.image_url || "/placeholder.svg"}
                                  className="size-6 rounded-sm object-cover"
                                  alt=""
                                />
                              )}
                              {card.name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {initialData ? "更新商品" : "建立商品"}
        </Button>
      </div>
    </form>
  )
}

export default function ShopPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<ShopItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopItem | undefined>(undefined)

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getShopItems(page, 20)
      setItems(response.data)
      setTotalPages(response.pagination.total_pages)
    } catch (error) {
      console.error("Failed to fetch shop items:", error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "無法載入商店商品列表",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [page])

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這個商品嗎？")) return

    try {
      await apiClient.deleteShopItem(id)
      toast({
        title: "成功",
        description: "商品已刪除",
      })
      fetchItems()
    } catch (error) {
      console.error("Failed to delete item:", error)
      const errorMessage = error instanceof Error ? error.message : "刪除商品失敗"
      toast({
        variant: "destructive",
        title: "錯誤",
        description: errorMessage,
      })
    }
  }

  const handleEdit = (item: ShopItem) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingItem(undefined)
    setIsDialogOpen(true)
  }

  const handleSuccess = () => {
    setIsDialogOpen(false)
    fetchItems()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">商店商品管理</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 size-4" />
              新增商品
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "編輯商品" : "建立新商品"}</DialogTitle>
            </DialogHeader>
            <ShopItemForm initialData={editingItem} onSuccess={handleSuccess} onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名稱</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>價格</TableHead>
              <TableHead>出現機率</TableHead>
              <TableHead>連結卡牌</TableHead>
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
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  找不到商店商品。
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${
                        item.type === "CARD"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {getItemTypeLabel(item.type)}
                    </span>
                  </TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell>{item.rate.toFixed(2)}</TableCell>
                  <TableCell>
                    {item.card ? (
                      <Link 
                        href={`/dashboard/cards?search_id=${item.card.id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        {item.card.image_url && (
                          <img
                            src={item.card.image_url || "/placeholder.svg"}
                            alt={item.card.name}
                            className="h-6 w-6 rounded-sm object-cover"
                          />
                        )}
                        <span>{item.card.name}</span>
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
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

      {/* Pagination */}
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
