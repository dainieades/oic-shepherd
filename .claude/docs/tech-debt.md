# Tech Debt Audit — OIC Shepherd

_Last audited: 2026-05-17_

### Scoring: Priority = (Impact + Risk) × (6 − Effort)

---

## Active Debt Items

### 9. Large utility and data files

**Category:** Code debt  
**Files:** `src/lib/utils.ts` (608 lines, 34 exports), `src/lib/data.ts` (3,199 lines)  
**Score:** (2 + 1) × (6 − 3) = **9**

`utils.ts` mixes date formatting, sorting, string helpers, and colour utilities. `data.ts` is a flat mock-data dump. Low immediate risk but hard to navigate.

**Fix:** Split `utils.ts` into `utils/dates.ts`, `utils/sort.ts`, `utils/format.ts`, `utils/colors.ts` with a barrel re-export. Split `data.ts` by entity type when mock data changes are needed.

---

## Phased Remediation Plan

**Phase 1 — Safety net (do first, unblocks everything else)**

- [x] Add `src/app/error.tsx` + `src/app/global-error.tsx`
- [x] Standardise mutation catch blocks in `context.tsx` to always call `showToast`
- [x] Remove debug `console.log` calls from `context.tsx`

**Phase 2 — High-leverage extractions (do alongside next features)**

- [x] Extract shared `TabIcon`, `TodoSection`, `LogSection` from person + family pages → `src/components/`
- [x] Extract `FilterPanelBase` from the two filter panels
- [x] Move all inline hardcoded styles in `signin/page.tsx` to CSS tokens or Tailwind

**Phase 3 — Architecture (plan before the next large feature)**

- [x] Move auth flows out of page components into context or server actions
- [x] Split AppContext mutations into domain-scoped modules if the file grows beyond 1,500 lines again

**Backlog (nice-to-have)**

- [ ] Split `utils.ts` by domain
- [ ] Add server-side pagination if dataset grows beyond ~1K people
- [x] Replace `fallback={null}` Suspense boundaries with visible loaders

---

## Completed

- ✅ 2026-05-17 Remove all inline styles: extended Tailwind config with `@theme inline` to expose all design tokens as utilities; swept all 85 src files replacing `style={{ … }}` props with Tailwind classes (1,308 → ~381 remaining, all legitimately dynamic)
- ✅ 2026-05-17 **#3 Missing error boundaries**: added `error.tsx`, `global-error.tsx`, `not-found.tsx`; standardised catch blocks in `context.tsx` to call `showToast`
- ✅ 2026-05-17 **#8 Suspense `fallback={null}`**: preload all lazy chunks on idle via `requestIdleCallback`; added space-holding fallbacks for `SortControls` and `SearchBar` (always-visible mobile UI)
- ✅ 2026-05-17 **#7 Console.logs (context.tsx)**: removed 9 debug `console.log` calls from `context.tsx`; API routes remain (see active item #7)
- ✅ 2026-05-17 **#5 Duplicated filter panel logic**: extracted `FilterPanelBase` (shell + category nav + footer); `FilterPanel` and `LogsFilterPanel` are now thin wrappers; also fixed remaining inline styles in `LogsFilterPanel`
- ✅ 2026-05-17 **#6 Hardcoded values in inline styles**: audited all 6 flagged files; replaced hardcoded `px`, `rem`, and `#hex` values with CSS token references (`var(--spacing-lg)`, `var(--on-sage)`) and Tailwind utilities; converted disabled-state opacity/cursor to `disabled:` modifiers; `EmailPreviewClient.tsx` shell now uses design tokens
- ✅ 2026-05-17 **#1 Monolithic AppContext**: extracted 5 domain hooks to `src/lib/hooks/` (`useFilterHook`, `usePreferencesHook`, `useNotesHook`, `useTodosHook`, `usePeopleHook`); `context.tsx` reduced from 2,293 → 641 lines; `useApp()` public API unchanged; TypeScript clean
- ✅ 2026-05-17 **#4 Direct Supabase calls from page components**: created `src/lib/auth.ts` with thin auth wrappers (`signInWithGoogle`, `signUp`, `signInWithPassword`, `resendConfirmation`, `resetPasswordForEmail`, `updatePassword`, `setNewPassword`); added `supabaseUser`, `signOut`, `linkGoogle`, `submitVisitorCard` to AppContext; all 6 affected pages now go through `src/lib/auth.ts` or context — zero direct `createClient()` calls remain in page components; moved `VisitorIntakeValues` to `src/lib/types.ts`; TypeScript clean
- ✅ 2026-05-17 **#2 Local components in page files**: extracted `TabIcon`, `LogSection`, `InfoSection`, `TodoSection`, `CalendarView`, `RecordInfoSection` to `src/components/`; `fmtDue` + `fmtShortDate` to `src/lib/utils.ts`; person, family, and todos pages now import shared versions; stale icon/util imports cleaned up; TypeScript clean
