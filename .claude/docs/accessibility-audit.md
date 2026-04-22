# Accessibility Audit — WCAG 2.1 AA
**Date:** 2026-04-22 | **Standard:** WCAG 2.1 AA

## Summary
**Issues found:** 17 | **Critical:** 1 | **Major:** 13 | **Minor:** 3
**Fixed 2026-04-22:** Issues 1–17 (all Critical, Major, and Minor)

---

## Critical

### [x] 1. No `Escape` key handler on `BottomSheet` (keyboard trap)
- **WCAG:** 2.1.1 Keyboard
- **File:** `src/components/BottomSheet.tsx`
- **Fix:** Add `useEffect` that listens for `keydown` and calls `onClose()` on `Escape`

---

## Major

### [x] 2. `BottomSheet` missing dialog semantics
- **WCAG:** 4.1.2 Name, Role, Value
- **File:** `src/components/BottomSheet.tsx`
- **Fix:** Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the sheet title. All modals/sheets that use `BottomSheet` will inherit this fix.

### [x] 3. No `button:focus-visible` rule — focus ring may be invisible
- **WCAG:** 2.4.7 Focus Visible
- **File:** `src/app/globals.css`
- **Fix:** Add:
  ```css
  button:focus-visible, a:focus-visible {
    outline: 2px solid var(--sage);
    outline-offset: 2px;
  }
  ```

### [x] 4. Form inputs have no `aria-label` — rely on placeholder alone
- **WCAG:** 3.3.2 Labels or Instructions
- **Files:** `src/components/form/TextInputRow.tsx`, `src/components/SearchBar.tsx`
- **Fix:** Pass `label` prop as `aria-label` on `<input>`. For `SearchBar`, add `aria-label="Search people by name"`.

### [x] 5. Unchecked checkbox border contrast too low (~2:1, requires 3:1)
- **WCAG:** 1.4.11 Non-text Contrast
- **File:** `src/components/CheckRow.tsx`
- **Fix:** Change border from `1.5px solid var(--border)` to `1.5px solid var(--text-secondary)`

### [x] 6. `FloatingDateRow` input border uses `--border-light` — too low contrast
- **WCAG:** 1.4.11 Non-text Contrast
- **File:** `src/components/form/FloatingDateRow.tsx`
- **Fix:** Change `--border-light` to `--border` on the input wrapper border

### [x] 7. Input focus ring shadow color (`--sage-light`) is near-white — fails 3:1
- **WCAG:** 1.4.11 Non-text Contrast
- **File:** `src/app/globals.css`
- **Fix:** Change focus box-shadow to use `var(--sage-mid)` or `var(--sage)` with reduced opacity

### [x] 8. `<div onClick>` in `TextInputRow` not keyboard accessible
- **WCAG:** 2.1.1 Keyboard
- **File:** `src/components/form/TextInputRow.tsx`
- **Fix:** The outer div just focuses the input on click — add `tabIndex={-1}` (it shouldn't be focusable itself; the `<input>` inside already is). Or remove the onClick if redundant.

### [x] 9. `<div onClick>` in `TextareaRow` not keyboard accessible
- **WCAG:** 2.1.1 Keyboard
- **File:** `src/components/form/TextareaRow.tsx`
- **Fix:** Same as above — `tabIndex={-1}` or remove redundant onClick

### [x] 10. Backdrop `<div onClick={onClose}>` in `FloatingDateRow` not keyboard-dismissible
- **WCAG:** 2.1.1 Keyboard
- **File:** `src/components/form/FloatingDateRow.tsx`
- **Fix:** Add `Escape` key handler alongside the existing backdrop click. Add `role="presentation"` to the backdrop div.

### [x] 11. Calendar day/nav buttons in `FloatingDateRow` have no focus styles
- **WCAG:** 2.4.7 Focus Visible
- **File:** `src/components/form/FloatingDateRow.tsx`
- **Fix:** Add `focus-visible:outline` styles to the inline `navBtnStyle` and day cell buttons

### [x] 12. Filter chip "×" button has a 9px icon — tap target likely < 44×44px
- **WCAG:** 2.5.5 Target Size
- **File:** `src/app/page.tsx`
- **Fix:** Increase `<X>` icon size to at least 16px; ensure the wrapping button has `min-width: 44px; min-height: 44px` or sufficient padding

### [x] 13. Icon-only buttons (search, filter, close, etc.) missing `aria-label`
- **WCAG:** 4.1.2 Name, Role, Value
- **Files:** `src/app/page.tsx`, various pages
- **Fix:** Add descriptive `aria-label` to every button that has only an icon child and no visible text (e.g. `aria-label="Search"`, `aria-label="Filter"`, `aria-label="Close"`)

### [x] 14. Error message in `InviteSheet` not announced by screen readers
- **WCAG:** 3.3.1 Error Identification
- **File:** `src/components/InviteSheet.tsx`
- **Fix:** Add `role="alert"` (or `aria-live="assertive"`) to the error message container so it is announced immediately when it appears

### [x] 15. Modal components don't pass ARIA label to `BottomSheet`
- **WCAG:** 4.1.2 Name, Role, Value
- **Files:** `src/components/AddPersonModal.tsx`, `AddLogModal.tsx`, `AddTodoModal.tsx`, `EditFamilyDrawer.tsx`, `InviteSheet.tsx`, `AppRolePickerSheet.tsx`, `LanguagePickerSheet.tsx`, `PersonPickerSheets.tsx`, `DatePickerSheet.tsx`
- **Fix:** Once `BottomSheet` accepts `aria-labelledby`, each modal should pass its title element's `id` so the dialog name is correct

---

## Minor

### [x] 16. Dashboard header uses `<div>` instead of `<header>`
- **WCAG:** 1.3.1 Info and Relationships
- **File:** `src/app/page.tsx`
- **Fix:** Replace the sticky top div with `<header>` element

### [x] 17. Page sections lack landmark roles
- **WCAG:** 1.3.1 Info and Relationships
- **Files:** `src/app/page.tsx`, `src/app/person/[id]/page.tsx`, `src/app/family/[id]/page.tsx`
- **Fix:** Use `<section aria-label="...">` or `<article>` for major content regions to aid screen reader navigation

---

## Color Contrast Reference

| Element | Foreground | Background | Ratio | Required | Status |
|---------|-----------|------------|-------|----------|--------|
| `--text-muted` body text | `#5c6470` | `#faf8fc` | 5.2:1 | 4.5:1 | ✅ |
| `--text-secondary` | `#4c5567` | `#faf8fc` | 7.6:1 | 4.5:1 | ✅ |
| `--sage-dark` on `--sage-light` | `#5c4778` | `#f2f0f5` | 6.5:1 | 4.5:1 | ✅ |
| Unchecked checkbox border (`--border`) | `#ded7e5` | `#fff` | ~2:1 | 3:1 | ❌ |
| Input focus shadow (`--sage-light`) | `#f2f0f5` | `#fff` | ~1.1:1 | 3:1 | ❌ |

---

## Estimated Remediation

| Priority | Issues | Effort |
|----------|--------|--------|
| High (shared components) | 1–5 | ~3 hrs |
| Medium (page-level) | 6–15 | ~4 hrs |
| Low (semantic HTML) | 16–17 | ~1 hr |
| **Total** | **17** | **~8 hrs** |
