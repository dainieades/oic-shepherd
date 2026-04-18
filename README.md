# OIC Shepherd

Mobile-first church shepherding app for One In Christ Church. Shepherds track and manage pastoral relationships with members — including people, families, groups, todos, logs, and notices.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript** (strict)
- **Tailwind CSS 4**
- **Supabase** (auth + database)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
shepherd-app/
  src/
    app/                    Next.js App Router pages + layouts
      layout.tsx            Root layout (providers, fonts)
      page.tsx              Main dashboard
      globals.css           Design tokens + base styles
      [feature]/            Each feature: page.tsx + optional api/route.ts
    components/             Shared UI components
    lib/
      context.tsx           AppContext — single source of all state
      data.ts               Seed data + initial state
      types.ts              All TypeScript types and enums
      utils.ts              Date, sort, format utilities
    utils/
      supabase/
        client.ts           Browser Supabase instance
        server.ts           Server Supabase instance (SSR)
  supabase/
    migrations/             SQL migrations (numbered)
    seed.sql                Dev seed data
```

## Key Conventions

- All app state lives in `AppContext` (`src/lib/context.tsx`) — never call Supabase directly from page components.
- All shared TypeScript types belong in `src/lib/types.ts`.
- Design tokens are CSS custom properties in `globals.css` — no hardcoded hex values.
- Icons use [Phosphor Icons](https://phosphoricons.com): `import { IconName } from '@phosphor-icons/react'`
- Path alias: `@/*` → `./src/*`
- Run `npx tsc --noEmit` to type-check before committing.

## Pages

| Route | Description |
|---|---|
| `/` | Home dashboard |
| `/person/[id]` | Person detail |
| `/family/[id]` | Family detail |
| `/groups/[id]` | Group detail |
| `/add` | Add person |
| `/todos` | Todos |
| `/logs` | Logs |
| `/profile` | User profile |
| `/settings/profile` | Profile settings |
| `/settings/access` | Access management |
