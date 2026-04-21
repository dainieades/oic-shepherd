# Tech Debt Audit — OIC Shepherd

_Last audited: 2026-04-21_

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

## ~~P6 — Main Dashboard is 2,067 Lines~~ ✅ Done 2026-04-21
**Score: (2+2)×(6-4) = 8**

~~`src/app/page.tsx` contains filter UI, sort logic, search memoization, action buttons, and list rendering all inline. The filtering and sort logic (~200 LOC) can't be tested or reused without carrying the entire page.~~

**What was done:** Extracted `<FilterPanel>` (full filter bottom sheet, ~580 LOC) into `src/components/FilterPanel.tsx`, `<SortControls>` (sort button + dropdown) into `src/components/SortControls.tsx`, and `<SearchBar>` (expandable search input) into `src/components/SearchBar.tsx`. Added `SORT_OPTIONS` to `src/lib/constants.ts`. `CheckRow` and `RadioRow` moved into `FilterPanel.tsx`. `page.tsx` reduced from ~2,067 to ~1,255 lines.

---

## ~~P8 — No Schema Documentation~~ ✅ Done 2026-04-20
**Score: (1+2)×(6-1) = 15**

~~The migrations in `supabase/migrations/` contain raw SQL with inline comments, but there is no ER diagram or relationship guide. The persona-vs-person-ID duality (where a shepherd is both a `Person` and a `Persona`) is a conceptual trap that catches new contributors.~~

**What was done:** Added `.claude/docs/schema.md` with a full entity guide, ASCII ER diagram, table-by-table column reference, and 5 key invariants (including the persona/person duality and the two-table shepherd assignment pattern).

---

## ~~P5 — AppContext Monolith~~ ✅ Done 2026-04-21 (partial)
**Score: (3+3)×(6-4) = 12**

~~`src/lib/context.tsx` is 1,570 lines handling: auth sync, Supabase data loading (11 tables), 45+ mutations, persona switching, filter state, and all 7 mapper functions. There is no separation between "what state looks like" and "how it gets persisted."~~

**What was done:** Extracted all 7 mapper functions (`mapPerson`, `mapFamily`, `mapPersona`, `mapNote`, `mapNotice`, `mapTodo`, `syncGoogleAvatar`) into `src/lib/mappers.ts`. `context.tsx` reduced from ~1,570 to ~1,405 lines. The mutations remain in context.tsx — a full reducer/adapter split is a higher-effort follow-on if the file continues to grow.

---

## ~~P7 — Missing Explicit Return Types on Context Mutations~~ ✅ Done 2026-04-20
**Score: (2+1)×(6-1) = 15**

~~Most mutations in `src/lib/context.tsx` rely on inferred return types. Callers don't get IDE autocomplete on results, and future changes to return shapes won't be caught by TypeScript until use sites break.~~

**What was done:** Added explicit `: Promise<void>` annotations to all 23 async mutation callbacks in `context.tsx`. `addPerson` already had `: Promise<string>` — left unchanged.

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
- [x] Extract `<FilterPanel>`, `<SortControls>`, `<SearchBar>` from `page.tsx` ✅ 2026-04-21
- [x] Write entity/schema documentation ✅ 2026-04-20
- [x] Extract mapper functions from `context.tsx` into `src/lib/mappers.ts` ✅ 2026-04-21

**Sprint 4 — Cleanup (completed 2026-04-21)**
- [x] Remove unused `startTransition` from `page.tsx` ✅ 2026-04-21
- [x] Standardise error toast copy via `SAVE_ERROR_MSG` constant ✅ 2026-04-21
- [x] Add Zod validation to `check-email` API route ✅ 2026-04-21
- [x] Expose `personaByPersonId` / `personaById` maps from context; fix O(n) scan in `updateGroup` ✅ 2026-04-21
- [x] Extract 4 picker sheets from `PersonFormBody` into `PersonPickerSheets.tsx` ✅ 2026-04-21
- [x] Extract todo filter logic from `todos/page.tsx` into `todo-utils.ts` ✅ 2026-04-21

**Backlog (plan before next major feature)**
- [ ] Split AppContext mutations into domain-scoped modules if the file grows beyond 1,500 lines again
- [ ] Add server-side pagination if dataset grows beyond ~1K people

---

## ~~P9 — Missing Snapshot Rollback in `updateFamilyMembers` + `updateGroupMembers`~~ ✅ Done 2026-04-21
**Score: (5+4)×(6-2) = 36**

~~`updateFamilyMembers` (`context.tsx` ~line 943) and `updateGroupMembers` (~line 1075) apply optimistic state updates inside `setData()` but never capture a snapshot beforehand. If the DB write fails, the try/catch cannot call `setData(snapshot)` — the UI is permanently out of sync.~~

~~The P1 fix wrapped all mutations in try/catch, but these two mutations set state before the `snapshot` variable is assigned.~~

**What was done:** Both mutations already had `snapshot = prev` as the first line inside `setData`, matching the exact pattern used in `updatePerson`, `addNote`, and all other mutations. The rollback path (`if (snapshot) setData(snapshot)`) was also correctly in place in both catch blocks. The fix was applied as part of the P1 work but the item was not marked done.

---

## ~~P10 — Sequential DB Writes Should Be Parallelised~~ ✅ Done 2026-04-21
**Score: (3+2)×(6-2) = 20**

~~Two places issue multiple Supabase writes in series that are fully independent:~~

1. ~~**`addFamily` / `updateFamilyMembers`** (`context.tsx`): Loop over `memberIds` issuing one `UPDATE people SET family_id` per member. O(n) sequential round trips.~~
2. ~~**`addPerson` post-creation block** (`AddPersonModal.tsx` ~line 189): `assignGroupsToPerson` then `assignShepherds` called in sequence even though neither depends on the other's result.~~

**What was done:** Replaced the sequential `for` loops in `addFamily` and `updateFamilyMembers` with `Promise.all(memberIds.map(...))`. Replaced the sequential `assignGroupsToPerson` / `assignShepherds` calls in `AddPersonModal.tsx` with a single `Promise.all([...])`. Also replaced the `updateGroupMembers` per-row `group_members` insert loop with a single batched `.insert()` call.

---

## ~~P11 — Large Component Files Need Extraction~~ ✅ Done 2026-04-21
**Score: (2+2)×(6-3) = 12**

~~Three client-side components are large enough that unrelated concerns are entangled.~~

**What was done:** Extracted the 4 self-contained picker sheet components (`GroupPickerSheet`, `SheepPickerSheet`, `ShepherdPickerSheet`, `PositionPickerSheet`) from `PersonFormBody.tsx` into `src/components/PersonPickerSheets.tsx`. `PersonFormBody.tsx` reduced from ~2,188 to ~1,237 lines. Extracted `todoMatchesSearch`, `todoMatchesShepherdFilter`, and `filterTodos` from `todos/page.tsx` into `src/lib/todo-utils.ts`; the page now calls `filterTodos(...)` in one line instead of ~50 lines inline. `AddPersonModal.tsx` was left as-is — its state is too interconnected for safe section extraction at this time.

---

## ~~P12 — Persona Lookup Is O(n) on Every Mutation~~ ✅ Done 2026-04-21
**Score: (2+2)×(6-2) = 16**

~~Several mutations (notably `updateGroup`) call `prev.personas.find(p => p.personId === personId)` inside a `setData` callback, scanning the full personas array each time.~~

**What was done:** Added `personaByPersonId: ReadonlyMap<string, Persona>` and `personaById: Map<string, Persona>` to `AppContextType`, computed with `useMemo` from `data.personas`. `switchPersona` now uses `personaById.get(id)`. The `updateGroup` `setData` callback builds a local `Map` from `prev.personas` for O(1) lookup instead of `.find()`.

---

## ~~P13 — Unused `startTransition` Destructure in `page.tsx`~~ ✅ Done 2026-04-21
**Score: (1+1)×(6-1) = 10**

~~`src/app/page.tsx` had `const [, startTransition] = React.useTransition();` where `startTransition` was never called.~~

**What was done:** Removed the entire `useTransition` call — `isSearchPending` was already derived from `search !== deferredSearch` on the line above, so the hook was fully redundant.

---

## ~~P14 — Inconsistent Error Toast Copy~~ ✅ Done 2026-04-21
**Score: (1+1)×(6-1) = 10**

~~Mutation error messages were inconsistent across save/add/update operations.~~

**What was done:** Added `SAVE_ERROR_MSG = 'Failed to save changes. Try again.'` to `src/lib/constants.ts`. All 14 save/add/update error toasts in `context.tsx` now use the constant. Delete-specific messages ("Failed to delete X. Try again.") were left unchanged as they are informative and already consistent with each other.

---

## ~~P15 — API Route Lacks Zod Validation~~ ✅ Done 2026-04-21
**Score: (2+2)×(6-1) = 20**

~~`src/app/api/check-email/route.ts` parsed the request body with a manual `typeof` check instead of Zod.~~

**What was done:** Added `z.object({ email: z.string().email() }).safeParse(...)` to `check-email/route.ts`. Uses `safeParse` (not `parse`) to avoid throwing — returns a `400` with `{ error: 'Invalid email' }` on failure, matching the existing error shape. The module-level schema (`BodySchema`) is defined once outside the handler.
