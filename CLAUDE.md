# OIC Shepherd — Claude Guidance

Mobile-first church shepherding app. Built with Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, Supabase.

> **Path alias:** `@/*` → `./src/*` · **Package manager:** npm · **Icons:** `@phosphor-icons/react`

---

## Tech Debt

After completing any item, update `.claude/docs/tech-debt.md`: mark done with ✅ date, check off the Phased Remediation Plan entry.

---

## Local Dev

Self-contained local Supabase stack via Docker; `.env.local` points at `http://127.0.0.1:54321`. Cloud creds backed up in `.env.local.cloud`. Full reference: `.claude/docs/local-dev.md`. After every `supabase db reset` run `./scripts/local-bootstrap.sh` to restore the three hidden test auth users + persona links.

---

## Email

App emails (invites, notifications, todo reminders) send via Gmail SMTP through `src/lib/emails/mailer.ts`. Sender account is env-driven (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) — to swap accounts (e.g. to `oicinfoteam@gmail.com`), see `.claude/docs/email-setup.md`. No code changes required.

---

## ⚠️ Next.js 16

Breaking changes from prior versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.

---

## Pages

| Route              | File                                            |
| ------------------ | ----------------------------------------------- |
| Dashboard          | `src/app/page.tsx` (55KB — targeted reads only) |
| Person detail      | `src/app/person/[id]/page.tsx`                  |
| Family detail      | `src/app/family/[id]/page.tsx`                  |
| Group detail       | `src/app/groups/[id]/page.tsx`                  |
| Add person         | `src/app/add/page.tsx`                          |
| Profile            | `src/app/profile/page.tsx`                      |
| Settings — profile | `src/app/settings/profile/page.tsx`             |
| Settings — access  | `src/app/settings/access/page.tsx`              |
| Todos              | `src/app/todos/page.tsx`                        |
| Logs               | `src/app/logs/page.tsx`                         |

Large modals/drawers: `EditPersonDrawer`, `AddPersonModal`, `EditFamilyDrawer`, `AddFamilyModal`, `AddTodoModal`, `AddLogModal`, `AddNoticeModal`, `DatePickerSheet`, `GroupPreviewModal`.

Utility components: `AccessGate`, `AuthSync`, `BottomNav`, `Toast`, `PersonFamilyPicker`, `PickerMenu`.

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

- **No hardcoded values** — use CSS custom properties from `globals.css` for all colors, border radii, spacing, shadows, z-index, **and typography**.
- Light mode only. Tailwind utilities OK; prefer tokens for brand values.
- **Full reference:** `.claude/docs/tokens.md`

### Typography tokens (all in `globals.css` `:root`)

**Font families** — `--font-sans` · `--font-serif` · `--font-mono`

**Font sizes** — `--text-9` through `--text-32` (rem values for 9 px – 32 px). Common: `--text-10` (uppercase labels) · `--text-11` · `--text-12` · `--text-13` · `--text-14` (body) · `--text-15` (base) · `--text-17` (section headings) · `--text-32` (page titles).

**Font weights** — `--font-normal` (400) · `--font-medium` (500) · `--font-semibold` (600) · `--font-bold` (700) · `--font-extrabold` (800)

**Line heights** — `--leading-none` (1) · `--leading-tight` (1.15) · `--leading-snug` (1.25) · `--leading-comfortable` (1.4) · `--leading-semi` (1.45) · `--leading-normal` (1.5) · `--leading-open` (1.55) · `--leading-loose` (1.6)

**Letter spacing** — `--tracking-tight-3` (-0.03em) · `--tracking-tight-2` · `--tracking-tight-1` (-0.01em) · `--tracking-normal` (0) · `--tracking-wide-2` through `--tracking-wide-6` (0.06em — uppercase labels)

**Usage in inline styles:**
```tsx
// ✅ correct
style={{ fontSize: 'var(--text-14)', fontWeight: 'var(--font-semibold)', letterSpacing: 'var(--tracking-wide-6)' }}
// ❌ wrong
style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.06em' }}
```

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

_Last updated: 2026-05-17._
