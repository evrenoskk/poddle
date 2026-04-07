# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Poddle - AI Pet Care mobile app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo (React Native) with expo-router

## Applications

### Poddle - AI Pet Care (`artifacts/poddle/`)
An AI-powered pet care companion mobile app.

**Features:**
- Home screen with active pet card, upcoming tasks, quick actions
- AI Chat (Poddle AI) with veterinary counselor system prompt
- Photo/video upload for visual analysis
- Health tracking with activity score ring (starts at 0, grows with logs/tasks)
- Calendar tab with monthly view, task dots, and date-based task browsing
- Task management (vaccinations, grooming, checkups, medications) — sub-tab under Calendar
- Nearby veterinarian listing with GPS + appointment booking — sub-tab under Calendar
- Freemium model: 5 free questions → $0.50/question or $9.99/month subscription
- Pet profile management with photo support

**Design:**
- Clean white/blue theme matching reference screenshots
- Blue primary (#2563EB) with green accent (#10B981)
- Inter font family (400/500/600/700)
- Animated health score ring (react-native-reanimated)
- LinearGradient headers
- SharedHeader component (`components/SharedHeader.tsx`) — consistent header across all tabs with profile button always in top-left, title, optional subtitle, and right-side action buttons. Each tab uses this shared layout.
- Auto-select first pet when `activePetId` is null but pets exist (prevents silent failures in session creation, health logs, etc.)
- UserProfileModal includes "Tüm Görevleri Temizle" button (visible when tasks exist) for clearing all local tasks

### API Server (`artifacts/api-server/`)
Express 5 backend with:
- `POST /api/poddle/chat` — Streaming AI chat with GPT-5.2, veterinary system prompt
  - Accepts text, history, petContext, imageBase64
  - Returns SSE stream
- OpenAI integration via Replit AI Integrations

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## AI Integration
Uses Replit AI Integrations (Gemini) — no user API key required.
Model: `gemini-3.1-pro-preview` (latest, most powerful)
Environment variables: `AI_INTEGRATIONS_GEMINI_BASE_URL`, `AI_INTEGRATIONS_GEMINI_API_KEY`
Image analysis: Supports inline base64 image input via Gemini vision.
