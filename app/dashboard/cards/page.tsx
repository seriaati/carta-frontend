"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { apiClient, type Card as CardType } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Search, Loader2, ImageIcon, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useDebounce } from "@/hooks/use-debounce"

// Form component for Create/Edit
function CardForm({
  initialData,
  onSuccess,
  onCancel,
}: {
  initialData?: CardType
  onSuccess: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    rarity: initialData?.rarity || "C",
    attack: initialData?.attack || undefined,
    defense: initialData?.defense || undefined,
    price: initialData?.price || 0,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let base64Image = undefined

      if (imageFile) {
        // Convert file to base64 string (without data:image/xyz;base64, prefix for API if needed,
        // but standard base64 usually includes it or API handles it.
        // Based on schema it expects bytes, client usually sends base64 string in JSON)
        const reader = new FileReader()
        base64Image = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(imageFile)
        })
        // Remove header if API expects raw base64
        // base64Image = base64Image.split(',')[1]
      }

      if (initialData) {
        await apiClient.updateCard(initialData.id, {
          ...formData,
          image: base64Image,
        })
        toast({
          title: "成功",
          description: "卡牌更新成功",
        })
      } else {
        if (!base64Image) {
          toast({
            variant: "destructive",
            title: "錯誤",
            description: "新增卡牌必須上傳圖片",
          })
          setIsLoading(false)
          return
        }
        await apiClient.createCard({
          ...formData,
          image: base64Image,
        })
        toast({
          title: "成功",
          description: "卡牌建立成功",
        })
      }
      onSuccess()
    } catch (error) {
      console.error("Failed to save card:", error)
      const errorMessage = error instanceof Error ? error.message : "儲存卡牌失敗"
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

        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="description" className="text-right pt-2">
            描述
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="col-span-3"
            required
            rows={4}
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="rarity" className="text-right">
            稀有度
          </Label>
          <Select value={formData.rarity} onValueChange={(value: any) => setFormData({ ...formData, rarity: value })}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="選擇稀有度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="R">R</SelectItem>
              <SelectItem value="SR">SR</SelectItem>
              <SelectItem value="SSR">SSR</SelectItem>
              <SelectItem value="UR">UR</SelectItem>
              <SelectItem value="LR">LR</SelectItem>
              <SelectItem value="EX">EX</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="price" className="text-right">
            價格
          </Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number.parseInt(e.target.value) || 0 })}
            className="col-span-3"
            required
            min={0}
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="attack" className="text-right">
            攻擊力 (可選)
          </Label>
          <Input
            id="attack"
            type="number"
            value={formData.attack ?? ""}
            onChange={(e) => setFormData({ ...formData, attack: e.target.value ? Number.parseInt(e.target.value) : undefined })}
            className="col-span-3"
            min={0}
            placeholder="留空表示無攻擊力"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="defense" className="text-right">
            防禦力 (可選)
          </Label>
          <Input
            id="defense"
            type="number"
            value={formData.defense ?? ""}
            onChange={(e) => setFormData({ ...formData, defense: e.target.value ? Number.parseInt(e.target.value) : undefined })}
            className="col-span-3"
            min={0}
            placeholder="留空表示無防禦力"
          />
        </div>

        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="image" className="text-right pt-2">
            圖片
          </Label>
          <div className="col-span-3 space-y-2">
            <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
            {imagePreview && (
              <div className="relative aspect-[2/3] w-24 overflow-hidden rounded-md border">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Card preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {initialData ? "更新卡牌" : "建立卡牌"}
        </Button>
      </div>
    </form>
  )
}

export default function CardsPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [cards, setCards] = useState<CardType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CardType | undefined>(undefined)
  const [selectedCardImage, setSelectedCardImage] = useState<{ url: string; name: string } | null>(null)
  const [selectedCardDescription, setSelectedCardDescription] = useState<{ name: string; description: string } | null>(null)
  const [searchId, setSearchId] = useState("")
  const [sortBy, setSortBy] = useState<'id' | 'created_at' | 'updated_at'>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Initialize search from URL params
  useEffect(() => {
    const urlSearchId = searchParams.get('search_id')
    if (urlSearchId) {
      setSearchId(urlSearchId)
    }
  }, [searchParams])

  const debouncedSearch = useDebounce(search, 500)
  const debouncedSearchId = useDebounce(searchId, 500)

  const fetchCards = async () => {
    setIsLoading(true)
    try {
      const options: any = {
        sort_by: sortBy,
        sort_order: sortOrder,
      }
      
      if (debouncedSearch) {
        options.search_name = debouncedSearch
      }
      
      const parsedSearchId = Number.parseInt(debouncedSearchId)
      if (debouncedSearchId && !Number.isNaN(parsedSearchId)) {
        options.search_id = parsedSearchId
      }
      
      const response = await apiClient.getCards(page, 20, options)
      setCards(response.data)
      setTotalPages(response.pagination.total_pages)
    } catch (error) {
      console.error("Failed to fetch cards:", error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "無法載入卡牌列表",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [page, debouncedSearch, debouncedSearchId, sortBy, sortOrder])

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這張卡牌嗎？")) return

    try {
      await apiClient.deleteCard(id)
      toast({
        title: "成功",
        description: "卡牌已刪除",
      })
      fetchCards()
    } catch (error) {
      console.error("Failed to delete card:", error)
      const errorMessage = error instanceof Error ? error.message : "刪除卡牌失敗"
      toast({
        variant: "destructive",
        title: "錯誤",
        description: errorMessage,
      })
    }
  }

  const handleEdit = (card: CardType) => {
    setEditingCard(card)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingCard(undefined)
    setIsDialogOpen(true)
  }

  const handleSuccess = () => {
    setIsDialogOpen(false)
    fetchCards()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">卡牌管理</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 size-4" />
              新增卡牌
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCard ? "編輯卡牌" : "建立新卡牌"}</DialogTitle>
            </DialogHeader>
            <CardForm initialData={editingCard} onSuccess={handleSuccess} onCancel={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="搜尋名稱..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-[120px]">
          <Input
            placeholder="搜尋 ID"
            type="number"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </div>
        <div className="w-[150px]">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger>
              <SelectValue placeholder="排序依據" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="created_at">建立時間</SelectItem>
              <SelectItem value="updated_at">更新時間</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[120px]">
          <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger>
              <SelectValue placeholder="排序順序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">降序</SelectItem>
              <SelectItem value="asc">升序</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">圖片</TableHead>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>名稱</TableHead>
              <TableHead>稀有度</TableHead>
              <TableHead>數值</TableHead>
              <TableHead>價格</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  找不到卡牌。
                </TableCell>
              </TableRow>
            ) : (
              cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <div 
                      className="relative aspect-[2/3] w-10 overflow-hidden rounded-sm border bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => card.image_url && setSelectedCardImage({ url: card.image_url, name: card.name })}
                    >
                      {card.image_url ? (
                        <img
                          src={card.image_url || "/placeholder.svg"}
                          alt={card.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-full w-full p-2 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{card.id}</TableCell>
                  <TableCell className="font-medium">{card.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${
                        card.rarity === "EX"
                          ? "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
                          : card.rarity === "LR"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : card.rarity === "UR"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                              : card.rarity === "SSR"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                : card.rarity === "SR"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                  : card.rarity === "R"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {card.rarity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {card.attack !== null && card.attack !== undefined && (
                        <span title="Attack">⚔️ {card.attack}</span>
                      )}
                      {card.defense !== null && card.defense !== undefined && (
                        <span title="Defense">🛡️ {card.defense}</span>
                      )}
                      {(card.attack === null || card.attack === undefined) && (card.defense === null || card.defense === undefined) && (
                        <span className="text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{card.price}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setSelectedCardDescription({ name: card.name, description: card.description })}
                        title="查看描述"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(card)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(card.id)}
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

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedCardImage} onOpenChange={() => setSelectedCardImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCardImage?.name}</DialogTitle>
          </DialogHeader>
          {selectedCardImage && (
            <div className="flex justify-center items-center p-4">
              <img
                src={selectedCardImage.url}
                alt={selectedCardImage.name}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Description Dialog */}
      <Dialog open={!!selectedCardDescription} onOpenChange={() => setSelectedCardDescription(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCardDescription?.name}</DialogTitle>
          </DialogHeader>
          {selectedCardDescription && (
            <div className="p-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {selectedCardDescription.description}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
