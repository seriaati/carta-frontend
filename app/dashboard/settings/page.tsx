"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [rarities, setRarities] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingRarities, setIsSavingRarities] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [promptResponse, raritiesResponse] = await Promise.all([
          apiClient.getBattlePrompt().catch(error => {
            if (error instanceof ApiError && error.status === 404) {
              console.log("No battle prompt set yet, using empty default")
              return { data: "" }
            }
            throw error
          }),
          apiClient.getShopRarities().catch(error => {
            if (error instanceof ApiError && error.status === 404) {
              console.log("No shop rarities set yet, using empty default")
              return { data: {} }
            }
            throw error
          })
        ])
        setPrompt(promptResponse.data)
        setRarities(raritiesResponse.data)
      } catch (error) {
        console.error("Failed to fetch settings:", error)
        toast({
          variant: "destructive",
          title: "錯誤",
          description: "載入設定失敗",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [toast])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await apiClient.updateBattlePrompt(prompt)
      toast({
        title: "成功",
        description: "戰鬥提示詞更新成功",
      })
    } catch (error) {
      console.error("Failed to update prompt:", error)
      const errorMessage = error instanceof Error ? error.message : "更新戰鬥提示詞失敗"
      toast({
        variant: "destructive",
        title: "錯誤",
        description: errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRarities = async () => {
    setIsSavingRarities(true)
    try {
      await apiClient.updateShopRarities(rarities)
      toast({
        title: "成功",
        description: "商店稀有度比率更新成功",
      })
    } catch (error) {
      console.error("Failed to update rarities:", error)
      const errorMessage = error instanceof Error ? error.message : "更新商店稀有度比率失敗"
      toast({
        variant: "destructive",
        title: "錯誤",
        description: errorMessage,
      })
    } finally {
      setIsSavingRarities(false)
    }
  }

  const handleRarityChange = (rarity: string, value: string) => {
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setRarities(prev => ({ ...prev, [rarity]: numValue }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">系統設定</h1>
        <p className="text-muted-foreground">設定全域遊戲參數</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>戰鬥 AI 系統提示詞</CardTitle>
          <CardDescription>
            此提示詞將引導 AI 裁判進行卡牌戰鬥。請定義戰鬥規則、風格以及判定勝負的標準。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">系統提示詞</Label>
            <Textarea
              id="prompt"
              placeholder="你是一位專業的集換式卡牌遊戲裁判..."
              className="min-h-[300px] font-mono text-sm"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {!isSaving && <Save className="mr-2 size-4" />}
              儲存變更
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>商店稀有度出現比率</CardTitle>
          <CardDescription>
            設定不同稀有度卡牌在商店中出現的比率。數值越高，該稀有度出現的機率越高。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["C", "R", "SR", "SSR", "UR", "LR", "EX"].map((rarity) => (
              <div key={rarity} className="space-y-2">
                <Label htmlFor={`rarity-${rarity}`}>{rarity}</Label>
                <div className="flex gap-2">
                  <input
                    id={`rarity-${rarity}`}
                    type="number"
                    min="0"
                    step="0.01"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    value={rarities[rarity] ?? 0}
                    onChange={(e) => handleRarityChange(rarity, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveRarities} disabled={isSavingRarities}>
              {isSavingRarities && <Loader2 className="mr-2 size-4 animate-spin" />}
              {!isSavingRarities && <Save className="mr-2 size-4" />}
              儲存變更
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
