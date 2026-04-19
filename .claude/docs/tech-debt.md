# Tech Debt Audit — OIC Shepherd

_Last audited: 2026-04-19_

### Scoring: Priority = (Impact + Risk) × (6 − Effort)

---

## P1 — Error Handling: Silent Mutation Failures
**Score: (5+5)×(6-2) = 40**

Every context mutation in `src/lib/context.tsx` does optimistic state updates followed by `await supabase...` with **no catch block**. If the DB write fails, the UI shows success and state is permanently stale.

Three mutations also have `.then(() => {})` no-ops (lines ~1100, 1124, 1164) — fire-and-forget with no error surface.

**Remediation:** Wrap each mutation in try/catch; on failure, rollback optimistic state and surface a toast error. Effort: Medium (2 sprints, touch each mutation).

---

## P2 — DRY Violations in Modal/Drawer Components
**Score: (4+3)×(6-2) = 28**

Six modal/drawer components (`AddLogModal`, `AddTodoModal`, `AddPersonModal`, `AddFamilyModal`, `EditPersonDrawer`, `EditFamilyDrawer`) each independently implement:

- The full overlay `<div>` with `position:fixed`, backdrop rgba, z-index
- The bottom-sheet container with `borderRadius: '20px 20px 0 0'`, `maxWidth: 430`, `height: calc(100dvh - 48px)`
- A Cancel/Title/Save header row
- The `whoLabel` truncation loop (identical 20-line block in `AddLogModal.tsx:86–105` and `AddTodoModal.tsx:82–100`)
- Date/time formatting helpers (`fmtDate`, `fmtLogDate`) duplicated across 4+ files

**Remediation:** Extract a shared `<BottomSheet>` wrapper component, a shared `<ModalHeader>` component, and consolidate date formatters into `src/lib/utils.ts`. Effort: Medium (1–2 sprints).

---

## P3 — Type Safety: Unsafe `as` Casts in Supabase Mappers
**Score: (4+4)×(6-3) = 24**

Six mapper functions in `src/lib/context.tsx` (`mapPerson`, `mapFamily`, `mapNote`, `mapTodo`, `mapNotice`, `mapPersona`) accept `Record<string, unknown>` and cast every field with `as string`, `as number`, etc. If a Supabase migration renames a column, type errors are invisible until runtime.

The `dbUpdates: Record<string, unknown>` pattern also repeats 6+ times with string keys that aren't validated against the actual schema.

**Remediation:** Introduce Zod schemas for each Supabase row type; validate at the DB boundary, remove `as` casts. Effort: Medium.

---

## P4 — Magic Numbers and Hardcoded Colors
**Score: (3+2)×(6-1) = 25**

Values that appear without named constants:
- `14` (default follow-up frequency days) — 10+ locations across `context.tsx` and `data.ts`
- `430` (modal max-width px) — 5 modals
- `'rgba(30,26,24,0.45)'` (backdrop) — 7 instances with slight variations (0.35, 0.45, 0.55) causing visual inconsistency
- `borderRadius: '20px 20px 0 0'` — 5 modals
- Hex color pairs for avatars (`#E8F0FE / #4A6FA5`, etc.) defined separately in `AddFamilyModal.tsx` and `AddPersonModal.tsx` — should be in `globals.css` tokens

**Remediation:** Extract to named constants or CSS custom properties. Effort: Low (< 1 day).

---

## P5 — AppContext Monolith
**Score: (3+3)×(6-4) = 12**

`src/lib/context.tsx` is 1,351 lines handling: auth sync, Supabase data loading (11 tables), 45+ mutations, persona switching, filter state, and all 6 mapper functions. There is no separation between "what state looks like" and "how it gets persisted."

**Remediation:** Split into a Supabase adapter module, a state reducer, and auth handlers. Keep as one file until it actively blocks feature work — this is a high-effort refactor that shouldn't be rushed. Effort: High.

---

## P6 — Main Dashboard is 2,067 Lines
**Score: (2+2)×(6-4) = 8**

`src/app/page.tsx` contains filter UI, sort logic, search memoization, action buttons, and list rendering all inline. The filtering and sort logic (~200 LOC) can't be tested or reused without carrying the entire page.

**Remediation:** Extract `<FilterPanel>`, `<SortControls>`, `<SearchBar>` as standalone components. Effort: High.

---

## P7 — Missing Explicit Return Types on Context Mutations
**Score: (2+1)×(6-1) = 15**

Most mutations in `src/lib/context.tsx` rely on inferred return types. Callers don't get IDE autocomplete on results, and future changes to return shapes won't be caught by TypeScript until use sites break.

**Remediation:** Add explicit `Promise<void>` or `Promise<Person>` annotations. Effort: Low.

---

## P8 — No Schema Documentation
**Score: (1+2)×(6-1) = 15**

The migrations in `supabase/migrations/` contain raw SQL with inline comments, but there is no ER diagram or relationship guide. The persona-vs-person-ID duality (where a shepherd is both a `Person` and a `Persona`) is a conceptual trap that catches new contributors.

**Remediation:** Add an ER diagram and a one-page entity guide to `.claude/docs/`. Effort: Low.

---

## Phased Remediation Plan

**Sprint 1 — Quick wins (run alongside feature work)**
- [ ] Extract shared `<BottomSheet>` + `<ModalHeader>` components (eliminates ~200 LOC of duplication)
- [ ] Consolidate `fmtDate` / `whoLabel` into `src/lib/utils.ts`
- [ ] Replace magic numbers with named constants; move colors to CSS tokens
- [ ] Add explicit return types to context mutations

**Sprint 2 — Reliability**
- [ ] Add try/catch + toast rollback to all context mutations
- [ ] Remove `.then(() => {})` no-ops
- [ ] Introduce Zod schemas for Supabase row mappers

**Sprint 3 — Maintainability**
- [ ] Extract `<FilterPanel>`, `<SortControls>` from `page.tsx`
- [ ] Write entity/schema documentation

**Backlog (plan before next major feature)**
- [ ] Split AppContext into adapter + reducer when the file actively blocks work
- [ ] Add server-side pagination if dataset grows beyond ~1K people
