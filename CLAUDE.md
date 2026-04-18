# OIC Shepherd — Claude Guidance

Mobile-first church shepherding app for One In Christ Church. Shepherds track and manage relationships with members. Built with Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, and Supabase.

> **Path alias:** `@/*` → `./src/*`
> **Package manager:** npm (not yarn or pnpm)
> **Icons:** Phosphor Icons — `import { IconName } from '@phosphor-icons/react'`

---

## ⚠️ Next.js 16 — Not the Next.js You Know

This version has breaking changes — APIs, conventions, and file structure may all differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

## Project State

### App Shell
- Root layout (`src/app/layout.tsx`): wraps everything in `AppContext` provider, mounts `AuthSync`, `BottomNav`, `Toast`
- Auth routes: `signin/`, `signup/`, `auth/callback/`

### Pages
| Route | File |
|---|---|
| Home dashboard | `src/app/page.tsx` (55KB — use targeted reads) |
| Person detail | `src/app/person/[id]/page.tsx` |
| Family detail | `src/app/family/[id]/page.tsx` |
| Group detail | `src/app/groups/[id]/page.tsx` |
| Add person | `src/app/add/page.tsx` |
| Profile | `src/app/profile/page.tsx` |
| Settings — profile | `src/app/settings/profile/page.tsx` |
| Settings — access | `src/app/settings/access/page.tsx` |
| Todos | `src/app/todos/page.tsx` |
| Logs | `src/app/logs/page.tsx` |

### Components
Large form drawers/modals: `EditPersonDrawer`, `AddPersonModal`, `EditFamilyDrawer`, `AddFamilyModal`, `AddTodoModal`, `AddLogModal`, `AddNoticeModal`, `DatePickerSheet`, `GroupPreviewModal`.

Utility: `AccessGate` (permission guard), `AuthSync` (Supabase sync), `BottomNav`, `Toast`, `PersonFamilyPicker`, `PickerMenu`, `PersonaSwitcherBar`.

---

## Architecture

```
shepherd-app/
  src/
    app/                    Next.js App Router pages + layouts
      layout.tsx            Root layout (providers, fonts)
      page.tsx              Main dashboard (55KB)
      globals.css           Design tokens + base styles
      [feature]/            Each feature: page.tsx + optional api/route.ts
    components/             Shared UI — no sub-folders currently
    lib/
      context.tsx           AppContext — single source of all state (48KB)
      data.ts               Seed data + initial state (91KB)
      types.ts              All TypeScript types and enums
      utils.ts              Date, sort, format utilities
    utils/
      supabase/
        client.ts           Browser Supabase instance
        server.ts           Server Supabase instance (SSR)
  supabase/
    migrations/             SQL migrations (numbered)
    seed.sql                Dev seed data (99KB)
```

---

## State Management

All state lives in `AppContext` (`src/lib/context.tsx`). Pages and components consume it via `useContext(AppContext)`.

**Never call Supabase directly from page components** — always go through context mutations.

Key mutations: `addPerson` · `updatePerson` · `deletePerson` · `addFamily` · `updateFamily` · `updateFamilyMembers` · `addGroup` · `updateGroup` · `updateGroupMembers` · `addNote` · `updateNote` · `deleteNote` · `addTodo` · `updateTodo` · `toggleTodo` · `deleteTodo` · `addNotice` · `updateNotice` · `deleteNotice` · `assignShepherds` · `assignGroupsToPerson` · `setFollowUpFrequency` · `setCurrentPersona`

Persona switching (`setCurrentPersona`) affects which people and data are visible throughout the app.

---

## Design Token Rules

- **Never use hardcoded hex values** — always use CSS custom properties from `src/app/globals.css`.
- **Light mode only** — no dark mode support.
- Tailwind CSS 4 utilities are available, but prefer custom tokens for brand-specific values.
- **Full token reference:** `.claude/docs/tokens.md`

---

## Coding Rules

- **TypeScript strict** — no `any`, no `as` casts without clear justification
- **Server components by default** — add `'use client'` only where interactivity requires it
- **React 19 patterns** — prefer `useActionState`, `use()` for async, server actions where appropriate
- **Mobile-first** — design for small screens; use `sm:` / `md:` Tailwind prefixes to scale up
- **No comments** unless the WHY is non-obvious (a hidden constraint, subtle invariant, or workaround)
- No test framework is configured — rely on TypeScript for correctness; run `npx tsc --noEmit` to type-check

### Type discipline

- **Run `npx tsc --noEmit` after every non-trivial change** — the project must stay error-free.
- **All shared types belong in `src/lib/types.ts`** — if a shape is used more than once, define it there, not inline.
- **Never widen a type to silence an error** — fix the root cause (wrong type, missing field, incorrect inference) instead of casting or using `any`.
- **Keep types in sync with the DB schema** — when a Supabase migration adds/removes/renames a column, update the matching interface in `types.ts` in the same change.
- **Prefer explicit return types on context mutations** — annotate functions in `context.tsx` so callers know the shape they're getting.
- **No `@ts-ignore` or `@ts-expect-error`** unless an inline comment explains the upstream issue it works around.

---

## Context Rules

- **Use subagents for exploration** when a task touches 3+ files or requires multi-file analysis.
- **Batch tool calls** — run independent reads, globs, and greps in parallel.
- **Targeted reads on large files** — `context.tsx` (48KB), `page.tsx` (55KB), `data.ts` (91KB). Use `offset` + `limit`, or grep first to find the relevant section.
- **Grep before reading** — confirm a file is relevant before reading it in full.

---

_Last updated: 2026-04-18._
