"use client"

import { useState, useEffect, use } from "react"
import { apiClient, type CardPool, type CardPoolCard, type Card } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Trash2, Loader2, ArrowLeft, Check, ChevronsUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PoolCardsPage({ params }: PageProps) {
  // Properly unwrap params in Next.js 15+
  const { id: poolIdStr } = use(params)
  const poolId = Number.parseInt(poolIdStr)
  const { toast } = useToast()

  const [pool, setPool] = useState<CardPool | null>(null)
  const [poolCards, setPoolCards] = useState<CardPoolCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [availableCards, setAvailableCards] = useState<Card[]>([])
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null)
  const [probability, setProbability] = useState(0.5)
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const [cardSearch, setCardSearch] = useState("")

  const router = useRouter()
  const debouncedCardSearch = useDebounce(cardSearch, 300)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [poolData, cardsData] = await Promise.all([
        apiClient.getCardPool(poolId),
        apiClient.getCardPoolCards(poolId),
      ])
      setPool(poolData)
      setPoolCards(cardsData)
    } catch (error) {
      console.error("Failed to fetch pool data:", error)
      toast({
        variant: "destructive",
        title: "錯誤",
        description: "無法載入卡池資料",
      })
      router.push("/dashboard/pools")
    } finally {
      setIsLoading(false)
    }
  }

  // Search available cards to add
  useEffect(() => {
    const searchCards = async () => {
      // Only search if dialog is open
      if (!isAddDialogOpen) return

      try {
        // Fetch all cards (or search if API supports it)
        // Assuming API returns paginated, we'll fetch first page for now
        // A real implementation would need a proper search endpoint
        const response = await apiClient.getCards(1, 50)
        setAvailableCards(response.data)
      } catch (error) {
        console.error("Failed to search cards:", error)
      }
    }

    searchCards()
  }, [isAddDialogOpen, debouncedCardSearch])

  useEffect(() => {
    fetchData()
  }, [poolId])

  const handleAddCard = async () => {
    if (!selectedCardId) return

    try {
      await apiClient.addCardToPool({
        pool_id: poolId,
        card_id: selectedCardId,
        probability: Number(probability),
      })
      toast({
        title: "成功",
        description: "卡牌已加入卡池",
      })
      setIsAddDialogOpen(false)
      setSelectedCardId(null)
      setProbability(0.5)
      fetchData()
    } catch (error) {
      console.error("Failed to add card to pool:", error)
      const errorMessage = error instanceof Error ? error.message : "新增卡牌至卡池失敗"
      toast({
        variant: "destructive",
        title: "錯誤",
        description: errorMessage,
      })
    }
  }

  const handleRemoveCard = async (id: number) => {
    if (!confirm("確定要將這張卡牌從卡池中移除嗎？")) return

    try {
      await apiClient.removeCardFromPool(id)
      toast({
        title: "成功",
        description: "卡牌已從卡池移除",
      })
      fetchData()
    } catch (error) {
      console.error("Failed to remove card:", error)
      const errorMessage = error instanceof Error ? error.message : "移除卡牌失敗"
      toast({
        variant: "destructive",
        title: "錯誤",
        description: errorMessage,
      })
    }
  }

  const handleUpdateProbability = async (id: number, newProbability: number) => {
    try {
      await apiClient.updateCardPoolCard(id, { probability: newProbability })
      toast({
        title: "成功",
        description: "機率已更新",
      })
      // Optimistic update
      setPoolCards((cards) => cards.map((c) => (c.card_pool_card_id === id ? { ...c, probability: newProbability } : c)))
    } catch (error) {
      console.error("Failed to update probability:", error)
      const errorMessage = error instanceof Error ? error.message : "更新機率失敗"
      toast({
        variant: "destructive",
        title: "錯誤",
        description: errorMessage,
      })
      fetchData() // Revert on error
    }
  }

  if (isLoading && !pool) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/pools")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{pool?.name}</h1>
          <p className="text-muted-foreground">管理卡牌與掉落率</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              加入卡牌至卡池
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>加入卡牌至卡池</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                        {selectedCardId
                          ? availableCards.find((card) => card.id === selectedCardId)?.name || "選擇卡牌..."
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
                                value={card.name} // Use name for filtering
                                onSelect={() => {
                                  setSelectedCardId(card.id)
                                  setIsComboboxOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCardId === card.id ? "opacity-100" : "opacity-0",
                                  )}
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="probability" className="text-right">
                  機率 (0.0-1.0)
                </Label>
                <Input
                  id="probability"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={probability}
                  onChange={(e) => setProbability(Number.parseFloat(e.target.value))}
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAddCard} disabled={!selectedCardId}>
                加入卡牌
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>卡牌</TableHead>
              <TableHead>稀有度</TableHead>
              <TableHead>機率</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {poolCards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  此卡池尚未加入卡牌。
                </TableCell>
              </TableRow>
            ) : (
              poolCards.map((poolCard) => (
                <TableRow key={poolCard.card_pool_card_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {poolCard.card?.image_url && (
                        <div className="relative aspect-[2/3] w-8 overflow-hidden rounded-sm border bg-muted">
                          <img
                            src={poolCard.card.image_url || "/placeholder.svg"}
                            alt={poolCard.card.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      {poolCard.card?.id ? (
                        <Link
                          href={`/dashboard/cards?search_id=${poolCard.card.id}`}
                          className="hover:underline text-primary"
                        >
                          {poolCard.card.name || `卡牌 #${poolCard.card.id}`}
                        </Link>
                      ) : (
                        poolCard.card?.name || `卡牌 #${poolCard.card_id}`
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {poolCard.card?.rarity && (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${
                          poolCard.card.rarity === "LR"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : poolCard.card.rarity === "UR"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                              : poolCard.card.rarity === "SSR" || poolCard.card.rarity === "SR"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {poolCard.card.rarity}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        className="h-8 w-24"
                        defaultValue={poolCard.probability}
                        onBlur={(e) => {
                          const val = Number.parseFloat(e.target.value)
                          if (val !== poolCard.probability && poolCard.card_pool_card_id) {
                            handleUpdateProbability(poolCard.card_pool_card_id, val)
                          }
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => poolCard.card_pool_card_id && handleRemoveCard(poolCard.card_pool_card_id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
