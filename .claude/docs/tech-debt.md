# Tech Debt Audit — OIC Shepherd

_Last audited: 2026-05-17_

### Scoring: Priority = (Impact + Risk) × (6 − Effort)

---

## Active Debt Items

### 1. Monolithic AppContext (2,293 lines)

**Category:** Architecture / Code debt  
**File:** `src/lib/context.tsx`  
**Score:** (5 + 4) × (6 − 3) = **27**

288 function/const definitions, 68 async mutations, auth state, filter state, and theme preferences all tangled together. Every feature change requires navigating the full file. Console.log debug calls left in (12+).

**Fix:** Split into domain modules: `useAuthContext`, `usePeopleContext`, `useTodosContext`, `useLogsContext`, `useFilterContext`. Extract as custom hooks loaded by a thin root provider.

---

### 2. Page files contain local components and helpers

**Category:** Code debt  
**Files:** `src/app/person/[id]/page.tsx` (1,281 lines), `src/app/family/[id]/page.tsx` (904 lines), `src/app/todos/page.tsx` (976 lines)  
**Score:** (4 + 3) × (6 − 2) = **28**

`TabIcon`, `TodoSection`, `LogSection`, `InfoSection`, `RecordInfoSection`, `fmtDue`, `fmtShortDate` — all defined inline inside page files. Cannot be tested independently, cannot be reused, make the files unnavigable.

**Fix:** Extract each named component/helper to `src/components/` per the project rule. Person and family pages share nearly identical `TabIcon`, `TodoSection`, `LogSection` — extract shared versions.

---

### 3. Missing error boundaries

**Category:** Infrastructure / Test debt  
**Scope:** App-wide — no `src/app/error.tsx` found  
**Score:** (4 + 4) × (6 − 1) = **40**

Any unhandled error in a Server Component will render a blank screen with no recovery path. Many context mutations catch errors and `console.error` them without surfacing feedback to the user.

**Fix:** Add `src/app/error.tsx` and `src/app/global-error.tsx`. Add `src/app/not-found.tsx` if absent. Standardise mutation error handling: every `.catch` block should call `showToast(message, 'error')`.

---

### 4. Direct Supabase calls from page components

**Category:** Architecture debt  
**Files:** `src/app/settings/page.tsx`, `src/app/settings/password/page.tsx`, `src/app/welcome/page.tsx`, `src/app/signin/page.tsx`, `src/app/reset-password/page.tsx`, `src/app/settings/layout.tsx`  
**Score:** (3 + 3) × (6 − 3) = **18**

Auth and DB calls scattered across pages violate the project rule ("Never call Supabase directly from page components"). Prevents consistent error handling and makes pages hard to test.

**Fix:** Auth flows (`signIn`, `signUp`, `signOut`, `resetPassword`, `updatePassword`) belong in the auth section of AppContext or dedicated server actions. Welcome/visitor submissions belong in a context mutation.

---

### 5. Duplicated filter panel logic

**Category:** Code debt  
**Files:** `src/components/FilterPanel.tsx` (548 lines), `src/components/LogsFilterPanel.tsx` (~548 lines)  
**Score:** (3 + 2) × (6 − 3) = **15**

Both panels share identical draft state, apply/clear pattern, and section layout. Any bug fix needs two patches.

**Fix:** Extract a generic `FilterPanelBase` with typed filter config; `FilterPanel` and `LogsFilterPanel` become thin wrappers that pass their config down.

---

### 6. Hardcoded values in inline styles

**Category:** Code debt  
**Files:** `src/app/signin/page.tsx` (padding repeated 6×), `src/app/welcome/page.tsx`, `src/app/email-preview/EmailPreviewClient.tsx`, `src/components/CalendarSubscribeOptions.tsx`, `src/components/SideNav.tsx`, `src/components/ImageCropModal.tsx`  
**Score:** (2 + 2) × (6 − 2) = **16**

Hardcoded `px`, `rem`, `#hex`, and `font-family` values that bypass the design token system. Most can be replaced with existing CSS custom properties from `globals.css`.

**Fix:** Audit each file above; replace hardcoded values with `var(--token)` references or Tailwind utilities. Email preview HTML is a legitimate exception (email clients strip custom properties) — annotate accordingly.

---

### 7. Console.log debug calls in production code

**Category:** Code debt  
**File:** `src/lib/context.tsx` (12+ calls), various API routes  
**Score:** (2 + 2) × (6 − 1) = **20**

Debug logs for auth flow, calendar sync, and data fetching left in. Leaks internal state structure; clutters prod console.

**Fix:** Remove debug logs. Keep one structured `console.error` per mutation catch block for server-side error visibility.

---

### 8. Suspense boundaries with `fallback={null}`

**Category:** Code debt / UX  
**File:** `src/app/page.tsx` (7 lazy-loaded modals, all `fallback={null}`)  
**Score:** (2 + 1) × (6 − 1) = **15**

Modals that open before their chunk loads show nothing. Low risk for modals triggered by user action, but worth documenting.

**Fix:** Add a minimal spinner fallback or preload chunks on idle with `import()` hints.

---

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

- [ ] Extract shared `TabIcon`, `TodoSection`, `LogSection` from person + family pages → `src/components/`
- [ ] Extract `FilterPanelBase` from the two filter panels
- [ ] Move all inline hardcoded styles in `signin/page.tsx` to CSS tokens or Tailwind

**Phase 3 — Architecture (plan before the next large feature)**

- [ ] Move auth flows out of page components into context or server actions
- [ ] Split AppContext mutations into domain-scoped modules if the file grows beyond 1,500 lines again

**Backlog (nice-to-have)**

- [ ] Split `utils.ts` by domain
- [ ] Add server-side pagination if dataset grows beyond ~1K people
- [ ] Replace `fallback={null}` Suspense boundaries with visible loaders

---

## Completed

- ✅ 2026-05-17 Remove all inline styles: extended Tailwind config with `@theme inline` to expose all design tokens as utilities; swept all 85 src files replacing `style={{ … }}` props with Tailwind classes (1,308 → ~381 remaining, all legitimately dynamic)
- ✅ 2026-05-17 Phase 1 safety net: added `error.tsx`, `global-error.tsx`, `not-found.tsx`; standardised catch blocks in `context.tsx` to call `showToast`; removed 9 debug `console.log` calls from `context.tsx`
