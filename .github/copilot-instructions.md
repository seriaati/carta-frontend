# Copilot Instructions for card-game-frontend

## Project Overview

This is a **Next.js 16.0.3** frontend application for a Trading Card Game (TCG) admin panel. The project uses **React 19.2.0**, **TypeScript 5**, and **Tailwind CSS 4.1.9** with the App Router architecture. It provides an administrative interface for managing cards, card pools, shop items, and game assets, with Discord OAuth authentication.

**Repository Size**: Small (~50 source files)  
**Primary Language**: TypeScript/TSX  
**Framework**: Next.js (App Router)  
**Package Manager**: pnpm  
**Build Tool**: Turbopack (Next.js default)  
**Target Runtime**: Node.js (server-side), Browser (client-side)

## Critical Build Information

### Package Manager
**ALWAYS use `pnpm` for this project** - NOT npm or yarn. The project uses `pnpm-lock.yaml`.

### Build Commands (In Order)

1. **Install Dependencies** (ALWAYS run first after cloning or when package.json changes):
   ```powershell
   pnpm install
   ```
   - Takes ~10-30 seconds depending on cache
   - Creates/updates `node_modules/`

2. **Development Server**:
   ```powershell
   pnpm run dev
   ```
   - Starts on `http://localhost:3000`
   - Uses Turbopack for fast refresh
   - Ready in ~4-5 seconds
   - Auto-updates `tsconfig.json` on first run (adds `.next/dev/types/**/*.ts` to include)
   - Runs in background - requires manual termination

3. **Production Build**:
   ```powershell
   pnpm run build
   ```
   - Takes ~5-10 seconds
   - Creates `.next/` directory with optimized output
   - TypeScript validation is **DISABLED** (`ignoreBuildErrors: true` in `next.config.mjs`)
   - Successfully generates static and dynamic routes
   - No test suite exists

4. **Production Server**:
   ```powershell
   pnpm run start
   ```
   - Runs production build on `http://localhost:3000`
   - Requires successful `pnpm run build` first

5. **Linting**:
   ```powershell
   pnpm run lint
   ```
   - **IMPORTANT**: This command is configured but **WILL FAIL** - ESLint is not installed as a dependency
   - No eslint config file exists (no `.eslintrc` or `eslint.config.js`)
   - If adding linting, install: `pnpm add -D eslint eslint-config-next`

### Known Build Issues & Workarounds

1. **TypeScript Errors Are Ignored**:
   - `next.config.mjs` sets `typescript.ignoreBuildErrors: true`
   - Build will succeed even with TypeScript errors
   - Manually check types if needed (though no `tsc` script exists)

2. **First Dev Server Run Modifies tsconfig.json**:
   - Next.js automatically adds `.next/dev/types/**/*.ts` to include array
   - Changes `jsx` from `preserve` to `react-jsx`
   - This is expected behavior - commit the changes

3. **No Test Suite**:
   - No testing framework installed (no Jest, Vitest, etc.)
   - No test scripts in package.json
   - If adding tests, recommend Vitest or Jest with React Testing Library

4. **ESLint Not Functional**:
   - `pnpm run lint` fails with "eslint is not recognized"
   - Script exists but dependency missing
   - Fix by running: `pnpm add -D eslint eslint-config-next`

## Project Architecture

### Directory Structure

```
app/                    # Next.js App Router pages and layouts
├── globals.css         # Global styles with Tailwind directives
├── layout.tsx          # Root layout with providers
├── page.tsx            # Homepage (redirects to /login or /dashboard)
├── auth/discord/callback/  # OAuth callback handler
├── dashboard/          # Protected admin pages
│   ├── layout.tsx      # Dashboard layout with sidebar
│   ├── page.tsx        # Dashboard overview
│   ├── cards/          # Card management
│   ├── pools/          # Card pool management
│   ├── settings/       # Settings page
│   └── shop/           # Shop items management
└── login/              # Login page

components/             # React components
├── app-sidebar.tsx     # Dashboard sidebar navigation
├── protected-route.tsx # Auth guard wrapper
├── theme-provider.tsx  # Dark/light theme provider
└── ui/                 # shadcn/ui components (50+ components)

contexts/               # React contexts
└── auth-context.tsx    # Authentication state management

lib/                    # Utilities and API clients
├── api.ts              # Low-level fetch wrapper
├── api-client.ts       # High-level API methods
└── utils.ts            # Utility functions (cn, etc.)

hooks/                  # Custom React hooks
public/                 # Static assets (images, icons)
styles/                 # Additional stylesheets
```

### Key Configuration Files

- `next.config.mjs`: Next.js config - TypeScript errors ignored, images unoptimized
- `tsconfig.json`: TypeScript config with `@/*` path alias
- `postcss.config.mjs`: Tailwind CSS PostCSS plugin
- `components.json`: shadcn/ui configuration
- `package.json`: Dependencies and scripts

### Architecture Patterns

1. **Authentication Flow**:
   - Discord OAuth via `/api/auth/discord/*` endpoints
   - JWT tokens stored in `localStorage` (`access_token`)
   - `AuthContext` provides global auth state
   - `ProtectedRoute` component guards dashboard pages
   - Token validation via JWT decode (no external library)

2. **API Communication**:
   - Backend API expected at `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8080`)
   - `lib/api.ts`: Core fetch wrapper with auth headers
   - `lib/api-client.ts`: Typed API methods for cards, pools, shop items
   - Auto-redirect to `/login` on 401 responses

3. **UI Component Library**:
   - Uses **shadcn/ui** (50+ components in `components/ui/`)
   - Built on **Radix UI** primitives
   - Styled with **Tailwind CSS**
   - Icon library: **Lucide React**
   - Uses "new-york" style variant

4. **State Management**:
   - React Context for auth (`contexts/auth-context.tsx`)
   - No external state management (no Redux, Zustand, etc.)
   - Client-side rendering for interactive components (`'use client'`)

5. **Styling**:
   - Tailwind CSS 4.1.9 (latest version)
   - CSS variables for theming (`@/app/globals.css`)
   - Dark mode support via `next-themes`
   - Responsive design with Tailwind breakpoints

### Path Aliases

Use the `@/*` alias for all imports:
- `@/components/*` → components/
- `@/lib/*` → lib/
- `@/contexts/*` → contexts/
- `@/hooks/*` → hooks/
- `@/app/*` → app/

Example: `import { Button } from '@/components/ui/button'`

## Environment Variables

The application uses **environment variables** for configuration:

- `NEXT_PUBLIC_API_BASE_URL`: Backend API base URL (default: `http://localhost:8080`)
  - Prefix `NEXT_PUBLIC_` required for client-side access
  - Used in `lib/api.ts` and `lib/api-client.ts`

**Note**: No `.env` file exists in the repository. Create one if needed:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Validation & CI/CD

**No CI/CD pipelines currently exist**:
- No `.github/workflows/` directory
- No GitHub Actions configured
- No pre-commit hooks
- No automated testing

**Manual Validation Steps**:
1. Run `pnpm run build` to verify production build succeeds
2. Check browser console for runtime errors when running `pnpm run dev`
3. Manually test authentication flow
4. Verify API calls work with backend server running

## Common Coding Patterns

1. **Client Components**: Mark with `'use client'` directive when using hooks, state, or browser APIs
2. **Server Components**: Default in App Router - prefer for static content
3. **Forms**: Use `react-hook-form` with `@hookform/resolvers` and `zod` validation
4. **Toasts**: Use `sonner` library via `components/ui/toaster.tsx`
5. **Icons**: Use `lucide-react` components
6. **Internationalization**: Dashboard uses Chinese labels (儀表板, 卡牌管理, etc.)

## Dependencies to Note

**Core Framework**:
- next@16.0.3, react@19.2.0, react-dom@19.2.0

**UI Libraries**:
- 30+ @radix-ui packages for accessible components
- lucide-react for icons
- tailwindcss@4.1.9

**Forms & Validation**:
- react-hook-form, zod, @hookform/resolvers

**State & Routing**:
- next-themes (dark mode)
- React Context (auth)

**Charts**:
- recharts@2.15.4

**Dev Tools**:
- typescript@5, @types/node, @types/react, @types/react-dom

## Important Notes for Agents

1. **Always install dependencies first**: Run `pnpm install` before any build or dev commands
2. **Use pnpm exclusively**: Do not use npm or yarn
3. **TypeScript errors don't block builds**: But fix them for code quality
4. **Linting is broken**: Install eslint if needed for PR validation
5. **No tests exist**: Consider this when making large changes
6. **API backend required**: Most features need backend at `http://localhost:8080`
7. **Auth tokens in localStorage**: Client-side auth pattern, not secure for sensitive apps
8. **shadcn/ui components**: Don't modify `components/ui/*` directly - regenerate with shadcn CLI if needed
9. **Path aliases**: Always use `@/*` imports, never relative paths like `../../`
10. **Client vs Server Components**: Be intentional - use `'use client'` only when needed

## When Making Changes

1. **Before editing**: Run `pnpm install` to ensure dependencies are current
2. **After editing**: Run `pnpm run build` to verify no build-breaking changes
3. **Component changes**: Test in browser with `pnpm run dev`
4. **New dependencies**: Use `pnpm add <package>` (or `pnpm add -D` for devDependencies)
5. **New API endpoints**: Update `lib/api-client.ts` with typed methods
6. **New pages**: Add to `app/` directory, use existing layout patterns
7. **New UI components**: Use shadcn/ui CLI or copy existing patterns

**Trust these instructions** - they are validated by running actual commands. Only search for additional information if you encounter errors not documented here or need details about specific implementation files.
