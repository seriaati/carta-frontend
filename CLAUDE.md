# Trading Card Game Admin Panel - AI Agent Guide

## Project Identity

**Next.js 16 + React 19 + TypeScript** admin panel for a Discord-based trading card game. This frontend communicates with a FastAPI backend for managing cards, pools, shop items, and game settings.

**Critical:** Always use `pnpm` (not npm/yarn). TypeScript errors don't block builds (`ignoreBuildErrors: true`).

## Essential Architecture

### Authentication Flow (Non-Standard Pattern)

The app uses **Discord OAuth with JWT tokens stored in localStorage** - not the typical NextAuth.js pattern:

1. User clicks login → Frontend fetches Discord URL from `/api/auth/discord/login`
2. Discord redirects to `/auth/discord/callback` with code
3. Frontend exchanges code for JWT tokens via `/api/auth/discord/callback?code=...&state=...`
4. Tokens stored in `localStorage`: `access_token` and `refresh_token`
5. All API calls auto-inject `Authorization: Bearer {token}` header via [lib/api.ts](lib/api.ts)

**Auto-refresh pattern**: [lib/api.ts:39-104](lib/api.ts#L39-L104) intercepts 401 responses, attempts token refresh, then retries original request. On failure, auto-redirects to `/login`.

**Auth state**: Managed by [contexts/auth-context.tsx](contexts/auth-context.tsx) using React Context (no external state library). JWT decoded client-side to extract `is_admin` and `exp` claims.

### API Communication Architecture

**Two-layer design**:
- **Layer 1**: [lib/api.ts](lib/api.ts) - Low-level `apiRequest<T>()` wrapper handling auth, retries, and error translation
- **Layer 2**: [lib/api-client.ts](lib/api-client.ts) - High-level typed methods (`apiClient.getCards()`, `apiClient.createShopItem()`, etc.)

**Backend contract**: Expects `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8080`). Responses follow this structure:

```typescript
// List endpoints
{ status: string, data: T[], pagination: {...}, timestamp: string }

// Single resource endpoints
{ status: string, data: T, message: string | null, timestamp: string }
```

**Admin endpoints**: Backend has special admin-only endpoints (e.g., currency management documented in [ADMIN_CURRENCY_ENDPOINTS.md](ADMIN_CURRENCY_ENDPOINTS.md)). These return `403 Forbidden` if `is_admin: false`.

### Component Patterns

**shadcn/ui integration**: 50+ components in [components/ui/](components/ui/) built on Radix UI primitives. **Do not modify these directly** - regenerate via shadcn CLI if needed:

```bash
pnpx shadcn@latest add button  # Example
```

**Client vs Server Components**:
- Pages are Server Components by default (App Router)
- Use `'use client'` directive for: forms, state, browser APIs, auth guards
- Example: [components/protected-route.tsx](components/protected-route.tsx) uses `'use client'` for `useAuth()` hook

**Path aliases**: All imports use `@/*` prefix (configured in [tsconfig.json](tsconfig.json)):
```typescript
import { Button } from '@/components/ui/button'  // ✓ Correct
import { Button } from '../../components/ui/button'  // ✗ Wrong
```

## Critical Developer Workflows

### 1. First-Time Setup
```bash
pnpm install                    # Always first - creates node_modules
pnpm run dev                    # Starts dev server on :3000
# First run auto-modifies tsconfig.json - commit these changes
```

### 2. Production Build Workflow
```bash
pnpm run build                  # Creates .next/ directory
pnpm run start                  # Runs production server
```

**Known issue**: Linting is broken - `pnpm run lint` fails because ESLint isn't installed. Fix: `pnpm add -D eslint eslint-config-next`

### 3. Adding New API Endpoints

When backend adds endpoints, update [lib/api-client.ts](lib/api-client.ts):

```typescript
// Example: Adding currency management
export const apiClient = {
  // ... existing methods
  increaseCurrency: async (playerId: number, data: { amount: number, reason: string }) => {
    return apiRequest<Player>(`/players/${playerId}/currency/increase`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },
}
```

### 4. Adding New Dashboard Pages

Follow existing structure in [app/dashboard/](app/dashboard/):

```typescript
// app/dashboard/new-feature/page.tsx
'use client'  // Required for interactive features

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

export default function NewFeaturePage() {
  // Page implementation
}
```

**Layout inheritance**: Dashboard pages inherit sidebar from [app/dashboard/layout.tsx](app/dashboard/layout.tsx#L1-L50). Add new routes to [components/app-sidebar.tsx](components/app-sidebar.tsx) for navigation.

## Project-Specific Conventions

### 1. Chinese Labels in UI
Dashboard uses Chinese for navigation labels (see [components/app-sidebar.tsx](components/app-sidebar.tsx)):
- 儀表板 (Dashboard)
- 卡牌管理 (Card Management)
- 卡池管理 (Pool Management)
- 商店管理 (Shop Management)

**Pattern**: UI labels in Chinese, code/comments in English.

### 2. Form Handling Pattern
Standard stack: `react-hook-form` + `zod` + `@hookform/resolvers`

```typescript
// Common pattern across card/pool/shop pages
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ /* validation */ })
const form = useForm({ resolver: zodResolver(schema) })
```

### 3. Pagination Pattern
Backend uses `page` (1-indexed) and `page_size` query params:

```typescript
// Example from lib/api-client.ts:115-144
const params = new URLSearchParams({
  page: page.toString(),
  page_size: pageSize.toString(),
})
return apiRequest<PaginatedResponse<Card>>(`/api/cards/?${params}`)
```

### 4. Error Handling Pattern
[lib/api.ts](lib/api.ts) throws `ApiError` with structured data. Frontend pages should catch and display via toast:

```typescript
import { toast } from 'sonner'

try {
  await apiClient.createCard(data)
  toast.success('Card created successfully')
} catch (error) {
  toast.error(error instanceof Error ? error.message : 'Failed to create card')
}
```

## Integration Points & External Dependencies

### Backend API Contract

**Expected Base URL**: `NEXT_PUBLIC_API_BASE_URL` env variable (defaults to `http://localhost:8080`)

**Key endpoints** (see [lib/api-client.ts](lib/api-client.ts) for full list):
- `/api/auth/discord/*` - OAuth flow
- `/api/dashboard/stats` - Dashboard overview
- `/api/cards/*` - Card CRUD + pagination
- `/api/card-pools/*` - Pool management
- `/api/card-pool-cards/*` - Pool-card relationships
- `/api/shop-items/*` - Shop management
- `/api/settings/*` - Battle prompts, shop rarities

**Admin-only endpoints**: Require `is_admin: true` in JWT. Example: `/players/{id}/currency/*` (documented in [ADMIN_CURRENCY_ENDPOINTS.md](ADMIN_CURRENCY_ENDPOINTS.md))

### Discord OAuth Requirements

Backend must provide:
1. `GET /api/auth/discord/login` → `{ authorization_url: string }`
2. `GET /api/auth/discord/callback?code=...&state=...` → `{ access_token: string, refresh_token?: string }`
3. `POST /api/auth/refresh` with `{ refresh_token: string }` → new tokens

### Data Flow: Card Pools Example

Shows cross-component integration pattern:

1. [app/dashboard/pools/page.tsx](app/dashboard/pools/page.tsx) - Lists pools via `apiClient.getCardPools()`
2. [app/dashboard/pools/[id]/page.tsx](app/dashboard/pools/[id]/page.tsx) - Detail page fetches pool + cards via `apiClient.getCardPoolCards(poolId)`
3. Cards have `CardPoolCard` join table relationship with `probability` field
4. Backend returns cards with nested `card` object: `{ card_pool_card_id, pool_id, card_id, probability, card: {...} }`

## Common Gotchas & Solutions

### 1. TypeScript Errors Don't Block Builds
[next.config.mjs](next.config.mjs) sets `ignoreBuildErrors: true`. You must manually check types with `tsc --noEmit` if you want validation.

### 2. First Dev Server Run Modifies tsconfig.json
Next.js automatically adds `.next/dev/types/**/*.ts` to include array and changes `jsx` setting. **This is normal** - commit the changes.

### 3. No Test Suite Exists
Zero testing infrastructure. If adding tests, recommend:
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

### 4. LocalStorage Auth Pattern Security
Storing JWT in `localStorage` is vulnerable to XSS. This is acceptable for admin tools but **not for user-facing apps**. For production, migrate to httpOnly cookies.

### 5. Image Optimization Disabled
[next.config.mjs](next.config.mjs) sets `images.unoptimized: true`. Card images bypass Next.js Image Optimization. To enable, remove this setting and use `<Image>` component with proper `width`/`height`.

### 6. Rarity Type Constraints
Cards have rarity enum: `"C" | "R" | "SR" | "SSR" | "UR" | "LR" | "EX"` (see [lib/api-client.ts:10](lib/api-client.ts#L10)). Form validation must match backend enum exactly.

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| [lib/api.ts](lib/api.ts) | Core fetch wrapper with auto-refresh logic |
| [lib/api-client.ts](lib/api-client.ts) | Typed API methods for all backend endpoints |
| [contexts/auth-context.tsx](contexts/auth-context.tsx) | Auth state + JWT decode logic |
| [components/app-sidebar.tsx](components/app-sidebar.tsx) | Dashboard navigation (add new routes here) |
| [app/dashboard/layout.tsx](app/dashboard/layout.tsx) | Dashboard shell with sidebar |
| [app/globals.css](app/globals.css) | Tailwind directives + CSS variables for theming |
| [next.config.mjs](next.config.mjs) | TypeScript/image optimization config |
| [ADMIN_CURRENCY_ENDPOINTS.md](ADMIN_CURRENCY_ENDPOINTS.md) | Backend admin API reference (currency example) |

## When Implementing New Features

1. **API first**: Check if backend endpoint exists in [lib/api-client.ts](lib/api-client.ts). If not, verify backend supports it
2. **Auth check**: Does feature require admin? Use `useAuth()` hook and check `isAdmin`
3. **Page location**: Admin features go in [app/dashboard/](app/dashboard/), public features in [app/](app/)
4. **Component reuse**: Check [components/ui/](components/ui/) before creating custom components
5. **State management**: Use React Context for shared state (no Redux/Zustand installed)
6. **Forms**: Follow react-hook-form + zod pattern (see existing card/pool/shop pages)
7. **Build verification**: Run `pnpm run build` before committing to catch runtime errors

## Environment Setup

Create `.env.local` for custom backend URL:
```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend.com
```

Default assumes backend at `http://localhost:8080`.
