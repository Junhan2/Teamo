# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 설정
- 코드 작성은 영어로 유지
- 설명과 응답은 한글로 제공

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture Overview

### Authentication Flow
- **Middleware-based protection**: `middleware.ts` validates sessions and redirects unauthenticated users
- **OAuth with Google**: Primary authentication via Supabase Auth
- **Protected routes**: Routes under `app/(protected)/` require authentication
- **Auth callbacks**: Handled in `app/auth/callback/route.ts`

### Data Architecture
- **Dual Supabase clients**:
  - `lib/supabase/client.ts`: Browser-side operations
  - `lib/supabase/server.ts`: Server-side operations with cookies
- **Real-time subscriptions**: Uses Supabase channels for live updates on todos and team data
- **Optimistic updates**: UI updates before server confirmation for better UX

### Component Architecture
- **Server Components by default**: Layouts and non-interactive pages
- **Client Components**: Marked with `"use client"` for interactivity
- **Shared UI components**: Located in `components/ui/` (shadcn/ui based)
- **Feature components**: Top-level components like `TeamTodoList`, `CalendarView`

### State Management
- **Local state**: React useState for component-level state
- **Real-time sync**: Supabase subscriptions handle cross-client state
- **No global state library**: Relies on props and local state
- **Refresh patterns**: Manual refresh triggers for forcing data updates

### Key Patterns
- **Type safety**: Explicit interfaces for all data models (Todo, UserProfile, TeamMemo)
- **Error handling**: Try-catch blocks with user-friendly error states
- **Mobile-first**: Custom `useMobile` hook for responsive behavior
- **Animation**: Framer Motion for transitions and micro-interactions

## Database Schema

### Core Tables
- **users**: User profiles with display names and metadata
- **teams**: Team information with creation tracking
- **team_members**: Many-to-many relationship for team membership
- **todos**: Tasks with title, description, status, assignee
- **team_memos**: Shared team notes with tagged todos

### Key Relationships
- Users can belong to multiple teams
- Todos are assigned to users within teams
- Team memos can reference multiple todos
- All tables use UUID primary keys

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Design System

Follows Gray Cool color palette defined in `design-system.md`:
- Primary actions: Sky blue palette
- Status indicators: Amber (pending), Blue (in progress), Emerald (complete)
- UI foundation: Gray Cool scale for backgrounds and text

## Important Considerations

- **RLS Policies**: Supabase Row Level Security must be properly configured
- **Server/Client boundary**: Be explicit about component types to avoid hydration issues
- **Real-time cleanup**: Always unsubscribe from Supabase channels on component unmount
- **Type imports**: Use proper TypeScript imports for shared interfaces