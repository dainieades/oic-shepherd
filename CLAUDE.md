# OIC Shepherd — Claude Guidance

Mobile-first church shepherding app. Built with Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, Supabase.

> **Path alias:** `@/*` → `./src/*` · **Package manager:** npm · **Icons:** `@phosphor-icons/react`

---

## Tech Debt

After completing any item, update `.claude/docs/tech-debt.md`: mark done with ✅ date, check off the Phased Remediation Plan entry.

---

## ⚠️ Next.js 16

Breaking changes from prior versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.

---

## Pages

| Route | File |
|-------|------|
| Dashboard | `src/app/page.tsx` (55KB — targeted reads only) |
| Person detail | `src/app/person/[id]/page.tsx` |
| Family detail | `src/app/family/[id]/page.tsx` |
| Group detail | `src/app/groups/[id]/page.tsx` |
| Add person | `src/app/add/page.tsx` |
| Profile | `src/app/profile/page.tsx` |
| Settings — profile | `src/app/settings/profile/page.tsx` |
| Settings — access | `src/app/settings/access/page.tsx` |
| Todos | `src/app/todos/page.tsx` |
| Logs | `src/app/logs/page.tsx` |

Large modals/drawers: `EditPersonDrawer`, `AddPersonModal`, `EditFamilyDrawer`, `AddFamilyModal`, `AddTodoModal`, `AddLogModal`, `AddNoticeModal`, `DatePickerSheet`, `GroupPreviewModal`.

Utility components: `AccessGate`, `AuthSync`, `BottomNav`, `Toast`, `PersonFamilyPicker`, `PickerMenu`, `PersonaSwitcherBar`.

---

## Architecture

```
src/
  app/              Pages + layouts (App Router)
    globals.css     Design tokens + base styles
  components/       Shared UI
    form/           Form primitives (TextInputRow, DateRow, PickerRow, etc.)
  lib/
    context.tsx     AppContext — all state (48KB)
    data.ts         Seed data (91KB)
    types.ts        All TS types and enums
    utils.ts        Date, sort, format helpers
    constants.ts    Named constants + palettes
    mappers.ts      Supabase row mappers
    schemas.ts      Zod schemas for DB rows
  utils/supabase/   client.ts + server.ts
supabase/
  migrations/       Numbered SQL migrations
  seed.sql          Dev seed (99KB)
```

---

## State Management

All state in `AppContext` (`src/lib/context.tsx`). **Never call Supabase directly from page components** — always use context mutations.

Key mutations: `addPerson` · `updatePerson` · `deletePerson` · `addFamily` · `updateFamily` · `updateFamilyMembers` · `addGroup` · `updateGroup` · `updateGroupMembers` · `addNote` · `updateNote` · `deleteNote` · `addTodo` · `updateTodo` · `toggleTodo` · `deleteTodo` · `addNotice` · `updateNotice` · `deleteNotice` · `assignShepherds` · `assignGroupsToPerson` · `setFollowUpFrequency` · `setCurrentPersona`

---

## Design Tokens

- **No hardcoded values** — use CSS custom properties from `globals.css` for all colors, border radii, spacing, shadows, and z-index.
- Available tokens: `--radius-sm/--radius/--radius-lg/--radius-pill`, `--shadow-card/--shadow-elevated`, `--backdrop`, avatar palettes, semantic colors.
- Light mode only. Tailwind utilities OK; prefer tokens for brand values.
- **Full reference:** `.claude/docs/tokens.md`

---

## Reusable Components

- **Check first** — grep `src/components/` before writing any UI. Use what exists.
- **Extract at two uses** — same pattern in two places → extract to `src/components/` immediately.
- **No local components** — never define a named helper (e.g. `InfoRow`, `CheckRow`) inside a page or component file.
- **Form primitives** → `src/components/form/` so all modals share one set of field components.
- **Compose, don't rewrite** — use `Button`, `BottomSheet`, `ModalHeader`, `AvatarBadge`, `StatusBadge`, etc.
- **Check tech debt** — `.claude/docs/tech-debt.md` lists known extraction targets. Extract when touching a relevant file.

---

## Coding Rules

- **TypeScript strict** — no `any`, no `as` casts without justification; run `npx tsc --noEmit` after every non-trivial change
- **Server components by default** — `'use client'` only where interactivity requires it
- **React 19** — prefer `useActionState`, `use()` for async, server actions where appropriate
- **Always** `import React from 'react'` and use `React.` namespace (`React.useState`, `React.useEffect`, etc.)
- **Mobile-first** — design for small screens; scale up with `sm:`/`md:` prefixes
- **Icons only** — `<Plus weight="bold" />` not `+`; never `UserPlus` semantic variants; never invent SVGs
- **No comments** unless WHY is non-obvious
- **All shared types** → `src/lib/types.ts`; never widen types to silence errors; no `@ts-ignore` without explanation
- **Explicit return types** on context mutations
- **`rem` units only** — use `rem` for all size/spacing/radius values; `px` is allowed only for `1px` borders (e.g. `border: '1px solid …'`)

---

## Context Rules

- Subagents for exploration when touching 3+ files.
- Batch independent tool calls in parallel.
- Targeted reads on large files — grep first, then `offset`+`limit`.

---

_Last updated: 2026-04-22._
