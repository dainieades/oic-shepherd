# Tech Debt Audit — OIC Shepherd

_Last audited: 2026-04-22_

### Scoring: Priority = (Impact + Risk) × (6 − Effort)

---

## Phased Remediation Plan

**Sprint 1 — Quick wins** ✅ Complete 2026-04-20
- [x] Extract shared `<BottomSheet>` + `<ModalHeader>` components ✅
- [x] Consolidate `fmtDate` / `whoLabel` into `src/lib/utils.ts` ✅
- [x] Replace magic numbers with named constants; move colors to CSS tokens ✅
- [x] Add explicit return types to context mutations ✅

**Sprint 2 — Reliability** ✅ Complete 2026-04-20
- [x] Add try/catch + toast rollback to all context mutations ✅
- [x] Remove `.then(() => {})` no-ops ✅
- [x] Introduce Zod schemas for Supabase row mappers ✅

**Sprint 3 — Maintainability** ✅ Complete 2026-04-21
- [x] Extract `<FilterPanel>`, `<SortControls>`, `<SearchBar>` from `page.tsx` ✅
- [x] Write entity/schema documentation ✅
- [x] Extract mapper functions from `context.tsx` into `src/lib/mappers.ts` ✅

**Sprint 4 — Cleanup** ✅ Complete 2026-04-21
- [x] Remove unused `startTransition` from `page.tsx` ✅
- [x] Standardise error toast copy via `SAVE_ERROR_MSG` constant ✅
- [x] Add Zod validation to `check-email` API route ✅
- [x] Expose `personaByPersonId` / `personaById` maps from context; fix O(n) scan in `updateGroup` ✅
- [x] Extract 4 picker sheets from `PersonFormBody` into `PersonPickerSheets.tsx` ✅
- [x] Extract todo filter logic from `todos/page.tsx` into `todo-utils.ts` ✅

**Sprint 5 — Component system** ✅ Complete 2026-04-22
- [x] Extract `<AvatarBadge>` — circular initial/photo badge used 15+ times inline ✅
- [x] Extract `<StatusBadge>` — pill badge for log status, note type, urgency used 20+ times inline ✅
- [x] Extract `<InfoRow>` — key-value detail row defined identically in `person/[id]` and `family/[id]` ✅
- [x] Extract `<SectionLabel>` — section header used 4 different ways ✅
- [x] Extract `<CheckRow>` / `<RadioRow>` — defined 3× with subtle styling inconsistencies ✅
- [x] Unify `SettingsRow` naming — renamed `SettingRow` → `SettingsRow` in `profile/page.tsx` ✅
- [x] Enforce `<Button>` usage — search/filter/add buttons in `page.tsx` now use `<Button>` ✅
- [x] Enforce `<BottomSheet>` usage — `showAddChoice` sheet in `page.tsx` now uses `<BottomSheet compact>` ✅

**Sprint 6 — Form component library** ✅ Complete 2026-04-22
- [x] Promote `TextInputRow`, `TextareaRow`, `DateRow`, `PickerRow` out of `PersonFormBody` into `src/components/form/` ✅
- [x] Extract `<EmptyState>` — 4 variants with title + description + optional icon ✅
- [x] Extract `<LogItem>` — log card with type badge, content, timestamp, creator ✅
- [x] Extract `<NoticeCard>` — notice card with urgency left-border, badge, content ✅

**Sprint 7 — Design token sweep** ✅ Complete 2026-04-22
- [x] Replace hardcoded hex values (`#b45309`, `#fcd34d`, `#fef3c7`, `#92400e`, `#EBF1F7`, `#6B8EAE`, `#FDF3E3`, `#C9912B`) with CSS vars ✅
- [x] Replace hardcoded `borderRadius: 8/10/12/14/20/999` with `--radius-xs`, `--radius-sm`, `--radius-md`, `--radius`, `--radius-xl`, `--radius-pill` tokens ✅
- [x] Apply `var(--shadow-card)` / `var(--shadow-elevated)` — 11 literal boxShadow values replaced ✅
- [x] Add spacing scale tokens: `--spacing-xs` through `--spacing-3xl` ✅
- [x] Add z-index scale tokens: full scale (`--z-sticky`, `--z-page`, `--z-subheader`, `--z-header`, `--z-dropdown`, `--z-modal`, `--z-sheet`, `--z-nested`, `--z-float`, `--z-toast`) — 40+ hardcoded values replaced ✅

**Sprint 8 — Component + token cleanup** ✅ Complete 2026-04-22
- [x] P16: Replace inline avatar divs in `groups/[id]/page.tsx` with `<AvatarBadge>` (leaders, shepherds, members sections) ✅
- [x] P17: Form subcomponents (`TextInputRow`, `TextareaRow`, `DateRow`, `PickerRow`) already extracted to `src/components/form/` — no duplication found ✅
- [x] P18: Replace remaining hardcoded colors (`#FEE2E2`, `#DC2626`, `#5B8A72`, `#FEF2F2`, `#FFFAF4`, `#D8D4D0`, `#fff` on colored backgrounds) with tokens; replace hardcoded z-index values (65, 71, 91, 9999) with `var(--z-*)` or `calc()` expressions ✅
- [x] P19: `CheckRow` and `RadioRow` already extracted to `src/components/` and imported by FilterPanel, LogsFilterPanel, todos — no duplication found ✅

**Backlog (plan before next major feature)**
- [ ] Split AppContext mutations into domain-scoped modules if the file grows beyond 1,500 lines again
- [ ] Add server-side pagination if dataset grows beyond ~1K people
