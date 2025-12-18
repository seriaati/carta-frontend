import { apiRequest } from "./api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

export interface Card {
  id: number
  name: string
  image_url?: string
  description: string
  rarity: "C" | "R" | "SR" | "SSR" | "UR" | "LR" | "EX"
  attack?: number
  defense?: number
  price: number
  created_at: string
  updated_at: string
}

export interface CardPool {
  id: number
  name: string
}

export interface CardPoolCard {
  card_pool_card_id: number
  pool_id?: number
  card_id?: number
  probability: number
  card?: Card
}

export interface ShopItem {
  id: number
  name: string
  price: number
  rate: number
  type: "ITEM" | "CARD"
  card_id?: number
  card?: Card
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  discord_id: string
  username: string
  currency: number
  created_at: string
  updated_at: string
}

export interface CurrencyAdjustment {
  amount: number
  reason: string
}

export interface CurrencySet {
  amount: number
  reason: string
}

export type EventType =
  | "EARN_MONEY"
  | "SPEND_MONEY"
  | "ADMIN_INCREASE_CURRENCY"
  | "ADMIN_DECREASE_CURRENCY"
  | "ADMIN_SET_CURRENCY"
  | "OBTAIN_CARD"
  | "SELL_CARD"
  | "GACHA_PULL"
  | "TRADE_CREATED"
  | "TRADE_ACCEPTED"
  | "TRADE_REJECTED"
  | "TRADE_CANCELLED"
  | "TRADE_CARD_SENT"
  | "TRADE_CARD_RECEIVED"
  | "TRADE_MONEY_SENT"
  | "TRADE_MONEY_RECEIVED"
  | "RANKED_SCORE_GAINED"
  | "RANKED_SCORE_LOST"
  | "RANKED_WEEKLY_REWARD"
  | "RANKED_PLAY_FEE"

export interface EventLog {
  id: number
  player_id: number
  player_name: string
  event_type: EventType
  context: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateEventLog {
  player_id: number
  event_type: EventType
  context: Record<string, any>
}

export interface UpdateEventLog {
  player_id?: number
  event_type?: EventType
  context?: Record<string, any>
}

export interface DashboardStats {
  total_players: number
  total_cards: number
  total_card_pools: number
  total_trades: number
  active_trades: number
  total_pvp_challenges: number
  active_pvp_challenges: number
  total_shop_items: number
  total_inventory_items: number
  total_deck_cards: number
}

export interface ApiResponse<T> {
  status: string
  data: T
  message: string | null
  timestamp: string
  pagination: Pagination | null
}

export interface Pagination {
  page: number
  page_size: number
  total_items: number
  total_pages: number
}

export interface PaginatedResponse<T> {
  status: string
  data: T[]
  message: string | null
  timestamp: string
  pagination: Pagination
}

export interface LoginURLResponse {
  authorization_url: string
}

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  token_type?: string
}

export const apiClient = {
  // Dashboard
  getDashboardStats: async () => {
    return apiRequest<ApiResponse<DashboardStats>>("/api/dashboard/stats")
  },

  // Auth
  getDiscordLoginUrl: async () => {
    return apiRequest<LoginURLResponse>("/api/auth/discord/login")
  },

  exchangeCodeForToken: async (code: string, state: string) => {
    return apiRequest<TokenResponse>(`/api/auth/discord/callback?code=${code}&state=${state}`)
  },

  refreshToken: async (refreshToken: string) => {
    return apiRequest<TokenResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  },

  logout: async () => {
    return apiRequest("/api/auth/logout", { method: "POST" })
  },

  // Cards
  getCards: async (
    page = 1, 
    pageSize = 20, 
    options?: {
      search_name?: string
      search_id?: number
      sort_by?: 'id' | 'created_at' | 'updated_at'
      sort_order?: 'asc' | 'desc'
    }
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    
    if (options?.search_name) {
      params.append('search_name', options.search_name)
    }
    if (options?.search_id !== undefined) {
      params.append('search_id', options.search_id.toString())
    }
    if (options?.sort_by) {
      params.append('sort_by', options.sort_by)
    }
    if (options?.sort_order) {
      params.append('sort_order', options.sort_order)
    }
    
    return apiRequest<PaginatedResponse<Card>>(`/api/cards/?${params.toString()}`)
  },

  getCard: async (id: number) => {
    return apiRequest<Card>(`/api/cards/${id}`)
  },

  createCard: async (data: any) => {
    return apiRequest<Card>("/api/cards/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateCard: async (id: number, data: any) => {
    return apiRequest<Card>(`/api/cards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  deleteCard: async (id: number) => {
    return apiRequest(`/api/cards/${id}`, { method: "DELETE" })
  },

  // Card Pools
  getCardPools: async (page = 1, pageSize = 20) => {
    return apiRequest<PaginatedResponse<CardPool>>(`/api/card-pools?page=${page}&page_size=${pageSize}`)
  },

  getCardPool: async (id: number) => {
    return apiRequest<CardPool>(`/api/card-pools/${id}`)
  },

  createCardPool: async (data: { name: string }) => {
    return apiRequest<CardPool>("/api/card-pools", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateCardPool: async (id: number, data: { name?: string }) => {
    return apiRequest<CardPool>(`/api/card-pools/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  deleteCardPool: async (id: number) => {
    return apiRequest(`/api/card-pools/${id}`, { method: "DELETE" })
  },

  // Card Pool Cards
  getCardPoolCards: async (poolId: number) => {
    const response = await apiRequest<{ status: string; data: CardPoolCard[] }>(`/api/card-pools/${poolId}/cards`)
    return response.data
  },

  getCardPoolCard: async (id: number) => {
    return apiRequest<CardPoolCard>(`/api/card-pool-cards/${id}`)
  },

  addCardToPool: async (data: { pool_id: number; card_id: number; probability: number }) => {
    return apiRequest<CardPoolCard>("/api/card-pool-cards", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateCardPoolCard: async (id: number, data: { pool_id?: number; card_id?: number; probability?: number }) => {
    return apiRequest<CardPoolCard>(`/api/card-pool-cards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  removeCardFromPool: async (id: number) => {
    return apiRequest(`/api/card-pool-cards/${id}`, { method: "DELETE" })
  },

  // Shop
  getShopItems: async (page = 1, pageSize = 20) => {
    return apiRequest<PaginatedResponse<ShopItem>>(`/api/shop-items/?page=${page}&page_size=${pageSize}`)
  },

  createShopItem: async (data: any) => {
    return apiRequest<ShopItem>("/api/shop-items/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateShopItem: async (id: number, data: any) => {
    return apiRequest<ShopItem>(`/api/shop-items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  deleteShopItem: async (id: number) => {
    return apiRequest(`/api/shop-items/${id}`, { method: "DELETE" })
  },

  // Settings / Prompt
  getBattlePrompt: async () => {
    return apiRequest<ApiResponse<string>>("/api/settings/prompt")
  },

  updateBattlePrompt: async (prompt: string) => {
    return apiRequest<ApiResponse<string>>("/api/settings/prompt", {
      method: "PUT",
      body: JSON.stringify({ prompt }),
    })
  },

  // Shop Rarities
  getShopRarities: async () => {
    return apiRequest<ApiResponse<Record<string, number>>>("/api/settings/shop-rarities")
  },

  updateShopRarities: async (rarities: Record<string, number>) => {
    return apiRequest<ApiResponse<Record<string, number>>>("/api/settings/shop-rarities", {
      method: "PUT",
      body: JSON.stringify(rarities),
    })
  },

  // Players
  getPlayers: async (
    page = 1,
    pageSize = 20,
    options?: {
      search_username?: string
      search_discord_id?: string
      sort_by?: 'id' | 'username' | 'currency' | 'created_at'
      sort_order?: 'asc' | 'desc'
    }
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })

    if (options?.search_username) {
      params.append('search_username', options.search_username)
    }
    if (options?.search_discord_id) {
      params.append('search_discord_id', options.search_discord_id)
    }
    if (options?.sort_by) {
      params.append('sort_by', options.sort_by)
    }
    if (options?.sort_order) {
      params.append('sort_order', options.sort_order)
    }

    return apiRequest<PaginatedResponse<Player>>(`/api/players/?${params.toString()}`)
  },

  getPlayer: async (id: string) => {
    return apiRequest<ApiResponse<Player>>(`/api/players/${id}`)
  },

  // Currency Management (Admin only)
  increaseCurrency: async (playerId: string, data: CurrencyAdjustment) => {
    return apiRequest<ApiResponse<Player>>(`/api/players/${playerId}/currency/increase`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  decreaseCurrency: async (playerId: string, data: CurrencyAdjustment) => {
    return apiRequest<ApiResponse<Player>>(`/api/players/${playerId}/currency/decrease`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  setCurrency: async (playerId: string, data: CurrencySet) => {
    return apiRequest<ApiResponse<Player>>(`/api/players/${playerId}/currency/set`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // Event Logs
  getEventLogs: async (
    page = 1,
    pageSize = 20,
    options?: {
      player_id?: number
      player_name?: string
      event_type?: EventType
    }
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })

    if (options?.player_id !== undefined) {
      params.append('player_id', options.player_id.toString())
    }
    if (options?.player_name) {
      params.append('player_name', options.player_name)
    }
    if (options?.event_type) {
      params.append('event_type', options.event_type)
    }

    return apiRequest<PaginatedResponse<EventLog>>(`/api/event-logs/?${params.toString()}`)
  },

  getEventLog: async (id: number) => {
    return apiRequest<ApiResponse<EventLog>>(`/api/event-logs/${id}`)
  },

  createEventLog: async (data: CreateEventLog) => {
    return apiRequest<ApiResponse<EventLog>>("/api/event-logs/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  updateEventLog: async (id: number, data: UpdateEventLog) => {
    return apiRequest<ApiResponse<EventLog>>(`/api/event-logs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  deleteEventLog: async (id: number) => {
    return apiRequest(`/api/event-logs/${id}`, { method: "DELETE" })
  },
}
