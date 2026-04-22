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

**Sprint 6 — Form component library**
- [ ] Promote `TextInputRow`, `TextareaRow`, `DateRow`, `PickerRow` out of `PersonFormBody` into `src/components/form/`
- [ ] Extract `<EmptyState>` — 4 variants with title + description + optional icon
- [ ] Extract `<LogItem>` — log card with type badge, content, timestamp, creator
- [ ] Extract `<NoticeCard>` — notice card with urgency left-border, badge, content

**Sprint 7 — Design token sweep**
- [ ] Replace hardcoded hex values (`#b45309`, `#fcd34d`, `#e8f0fe`, etc.) with CSS vars (`--amber`, `--sage`, etc.)
- [ ] Replace hardcoded `borderRadius: 8/12/14` with `--radius-sm`, `--radius`, `--radius-lg` tokens
- [ ] Apply `var(--shadow-card)` / `var(--shadow-elevated)` — tokens exist but are unused
- [ ] Add spacing scale tokens: `--spacing-xs` through `--spacing-2xl`
- [ ] Add z-index scale tokens: `--z-modal`, `--z-dropdown`, `--z-toast` (currently hardcoded 20/40/60)

**Backlog (plan before next major feature)**
- [ ] Split AppContext mutations into domain-scoped modules if the file grows beyond 1,500 lines again
- [ ] Add server-side pagination if dataset grows beyond ~1K people

---

## P16 — Inline UI Patterns Not Using Existing Components
**Score: (4+2)×(6-2) = 24**

`AvatarBadge`, `StatusBadge`, `InfoRow`, `CollapsibleSection`, and `Button` patterns are each implemented inline in multiple pages rather than using or extracting a shared component. This causes visual drift, makes global style changes require multi-file edits, and grows the page files unnecessarily.

**Key instances:**
- Avatar badge (circular initial/photo) — `page.tsx`, `person/[id]`, `family/[id]`, `groups/[id]` — 15+ occurrences, each manually computing initials and colors from `MEMBER_AVATAR_PALETTE`
- Status pill badge (`borderRadius: 999px` inline) — `page.tsx`, `person/[id]`, `AddNoticeModal` — 20+ occurrences
- `InfoRow` key-value pair — defined as a local component separately in `person/[id]/page.tsx` and `family/[id]/page.tsx`
- `CollapsibleSection` — 4 near-identical section header variants with `fontSize: 10`, `fontWeight: 600`, `textTransform: uppercase`, `letterSpacing: '0.06em'`
- `Button` exists in `src/components/Button.tsx` but `page.tsx` builds the search, filter, and add buttons inline

---

## P17 — Form Subcomponents Trapped Inside PersonFormBody
**Score: (3+2)×(6-2) = 20**

`TextInputRow`, `TextareaRow`, `PickerRow`, `DateRow`, and `FloatingDateRow` are defined inside `src/components/PersonFormBody.tsx` and cannot be imported by other form components. `AddPersonModal.tsx` (1,973 lines) either duplicates these or rebuilds them inline — it's unclear without a full audit.

Moving these to `src/components/form/` would let all modal/drawer forms share one set of styled form primitives, and reduce `PersonFormBody.tsx` (currently 1,237 lines) further.

---

## P18 — Design Token Violations
**Score: (3+1)×(6-2) = 16**

Several CSS values are hardcoded in components and pages instead of using the tokens defined in `src/app/globals.css`:

- **Colors:** `#b45309`, `#92400e`, `#fcd34d`, `#fef3c7`, `#e8f0fe` appear inline — should map to `--amber`, `--sage`, etc.
- **Border radius:** `8`, `12`, `14` hardcoded in many places — tokens `--radius-sm`, `--radius`, `--radius-lg` exist but aren't applied
- **Shadows:** `--shadow-card` and `--shadow-elevated` are defined but almost never used
- **Z-index:** Values 20, 40, 60 are hardcoded across modals and overlays — no named scale

---

## P19 — CheckRow / RadioRow Defined Three Times
**Score: (2+2)×(6-1) = 20**

`CheckRow` and `RadioRow` are local components defined inside both `FilterPanel.tsx` and `LogsFilterPanel.tsx`, with subtle styling differences (padding 7px vs 9px, borderRadius 5 vs 4). A third variant exists in `todos/page.tsx`. Any style change requires three edits; the visual inconsistencies are unintentional.

Extracting to `src/components/CheckRow.tsx` and `src/components/RadioRow.tsx` and normalising the variants would eliminate the duplication and give a single source of truth for the checkbox/radio list item pattern.
