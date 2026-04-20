# Tech Debt Audit — OIC Shepherd

_Last audited: 2026-04-19_

### Scoring: Priority = (Impact + Risk) × (6 − Effort)

---

## ~~P1 — Error Handling: Silent Mutation Failures~~ ✅ Done 2026-04-20
**Score: (5+5)×(6-2) = 40**

~~Every context mutation in `src/lib/context.tsx` does optimistic state updates followed by `await supabase...` with **no catch block**. If the DB write fails, the UI shows success and state is permanently stale.~~

~~Three mutations also have `.then(() => {})` no-ops (lines ~1100, 1124, 1164) — fire-and-forget with no error surface.~~

**What was done:** All 24 mutations in `context.tsx` wrapped in try/catch with snapshot rollback. Error toast added (`Toast.tsx` now has `success`/`error` variants). Provider nesting in `layout.tsx` swapped so `AppProvider` can consume `useToast`. The 3 `.then(() => {})` no-ops removed.

---

## ~~P2 — DRY Violations in Modal/Drawer Components~~ ✅ Done 2026-04-20
**Score: (4+3)×(6-2) = 28**

~~Six modal/drawer components each independently implemented the overlay/container structure, header row, `whoLabel` truncation, and date formatters.~~

**What was done:** Extracted `<BottomSheet>` (overlay + container + optional drag handle) and `<ModalHeader>` (Cancel/Title/Action header) into `src/components/BottomSheet.tsx`. Added `fmtDate`, `fmtDateTime`, and `truncateWhoLabel` to `src/lib/utils.ts`. All 6 modals/drawers updated to use shared components. Removed ~200 LOC of duplication.

---

## ~~P3 — Type Safety: Unsafe `as` Casts in Supabase Mappers~~ ✅ Done 2026-04-20
**Score: (4+4)×(6-3) = 24**

~~Six mapper functions in `src/lib/context.tsx` (`mapPerson`, `mapFamily`, `mapNote`, `mapTodo`, `mapNotice`, `mapPersona`) accept `Record<string, unknown>` and cast every field with `as string`, `as number`, etc. If a Supabase migration renames a column, type errors are invisible until runtime.~~

~~The `dbUpdates: Record<string, unknown>` pattern also repeats 6+ times with string keys that aren't validated against the actual schema.~~

**What was done:** Created `src/lib/schemas.ts` with Zod schemas for all 7 Supabase row types (`PersonRowSchema`, `FamilyRowSchema`, `PersonaRowSchema`, `NoteRowSchema`, `NoticeRowSchema`, `TodoRowSchema`, `GroupRowSchema`). All 6 mapper functions now call `Schema.parse(row)` at the DB boundary — invalid data throws at the seam rather than silently producing wrong types. All 6 `dbUpdates: Record<string, unknown>` updated to `Partial<XxxRow>` so column name typos are caught at compile time.

---

## ~~P4 — Magic Numbers and Hardcoded Colors~~ ✅ Done 2026-04-20
**Score: (3+2)×(6-1) = 25**

~~Values that appear without named constants:~~
- ~~`14` (default follow-up frequency days) — 10+ locations across `context.tsx` and `data.ts`~~
- ~~`430` (modal max-width px) — 5 modals~~
- ~~`'rgba(30,26,24,0.45)'` (backdrop) — 7 instances with slight variations (0.35, 0.45, 0.55) causing visual inconsistency~~
- ~~`borderRadius: '20px 20px 0 0'` — 5 modals~~
- ~~Hex color pairs for avatars (`#E8F0FE / #4A6FA5`, etc.) defined separately in `AddFamilyModal.tsx` and `AddPersonModal.tsx` — should be in `globals.css` tokens~~

**What was done:** Created `src/lib/constants.ts` with `DEFAULT_FOLLOW_UP_DAYS`, `SHEET_MAX_WIDTH`, `SHEET_BORDER_RADIUS`, `BACKDROP_COLOR`, `MEMBER_AVATAR_PALETTE`, and `SHEPHERD_AVATAR_PALETTE`. Added `--backdrop` and all avatar palette CSS custom properties to `globals.css`. Updated 25+ files across `src/components/` and `src/app/` to use shared constants. Standardised all backdrop opacity variants to a single `var(--backdrop)`. Removed 8 duplicate local palette definitions.

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

## ~~P7 — Missing Explicit Return Types on Context Mutations~~ ✅ Done 2026-04-20
**Score: (2+1)×(6-1) = 15**

~~Most mutations in `src/lib/context.tsx` rely on inferred return types. Callers don't get IDE autocomplete on results, and future changes to return shapes won't be caught by TypeScript until use sites break.~~

**What was done:** Added explicit `: Promise<void>` annotations to all 23 async mutation callbacks in `context.tsx`. `addPerson` already had `: Promise<string>` — left unchanged.

---

## P8 — No Schema Documentation
**Score: (1+2)×(6-1) = 15**

The migrations in `supabase/migrations/` contain raw SQL with inline comments, but there is no ER diagram or relationship guide. The persona-vs-person-ID duality (where a shepherd is both a `Person` and a `Persona`) is a conceptual trap that catches new contributors.

**Remediation:** Add an ER diagram and a one-page entity guide to `.claude/docs/`. Effort: Low.

---

## Phased Remediation Plan

**Sprint 1 — Quick wins (run alongside feature work)**
- [x] Extract shared `<BottomSheet>` + `<ModalHeader>` components (eliminates ~200 LOC of duplication) ✅ 2026-04-20
- [x] Consolidate `fmtDate` / `whoLabel` into `src/lib/utils.ts` ✅ 2026-04-20
- [x] Replace magic numbers with named constants; move colors to CSS tokens ✅ 2026-04-20
- [x] Add explicit return types to context mutations ✅ 2026-04-20

**Sprint 2 — Reliability**
- [x] Add try/catch + toast rollback to all context mutations ✅ 2026-04-20
- [x] Remove `.then(() => {})` no-ops ✅ 2026-04-20
- [x] Introduce Zod schemas for Supabase row mappers ✅ 2026-04-20

**Sprint 3 — Maintainability**
- [ ] Extract `<FilterPanel>`, `<SortControls>` from `page.tsx`
- [ ] Write entity/schema documentation

**Backlog (plan before next major feature)**
- [ ] Split AppContext into adapter + reducer when the file actively blocks work
- [ ] Add server-side pagination if dataset grows beyond ~1K people
