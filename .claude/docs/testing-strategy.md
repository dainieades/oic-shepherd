# Testing Strategy — OIC Shepherd

_Written: 2026-04-21_

## Stack

| Layer | Tool |
|---|---|
| Unit + logic | Vitest |
| Component rendering | @testing-library/react |
| E2E (future) | Playwright |

## Pyramid

```
     /   E2E (Playwright)   \      3–5 critical journeys (not yet set up)
    /   Component Tests      \     Key forms + access gates
   /   Unit Tests (Vitest)    \    Utils + API routes + schemas
```

---

## Priority 1 — `src/lib/utils.ts` unit tests ✅ Done 2026-04-21

Pure functions, no mocking needed. Test file: `src/lib/utils.test.ts`.

Functions covered: `formatPhone`, `normalizePhone`, `fmtDate`, `fmtDateTime`,
`truncateWhoLabel`, `getTimeAgo`, `getDaysAgoNumber`, `getDueLabel`,
`getPriorityScore`, `getFamilyPriorityScore`, `getFamilyUrgency`,
`getFamilyLastContact`, `searchPeople`, `categorizeTodos`, `generateId`,
`getMapUrl`, `buildGoogleCalendarUrl`, `buildIcsContent`, `getMembershipLabel`,
`getChurchAttendanceLabel`, `getNoteTypeLabel`.

---

## Priority 2 — `src/app/api/check-email/route.ts` ✅ Done 2026-04-21

| Scenario | Expected |
|---|---|
| Email not in approved_emails | `{ status: 'not-invited' }` |
| Approved, user exists (password) | `{ status: 'existing' }` |
| Approved, user exists (Google) | `{ status: 'google' }` |
| Approved, no user yet | `{ status: 'invited' }` |
| Missing service key env var | `{ status: 'no-service-key' }` |
| Supabase error | `{ status: 'error' }` |

Mock the Supabase client — don't hit the real DB.

---

## Priority 3 — `src/lib/schemas.ts` Zod schema tests ✅ Done 2026-04-21

Verify each schema accepts valid rows and rejects invalid ones (missing required
fields, bad enum values, wrong types).

---

## Priority 4 — Component tests ✅ Done 2026-04-21

| Component | What to test |
|---|---|
| `AccessGate` | Renders children when permitted; fallback when denied |
| `AddPersonModal` | Required fields block submission; calls `addPerson` on submit |
| `AddTodoModal` | Date picker integration; repeat setting persists |
| `Toast` | Appears on trigger; dismisses after timeout |
| `PersonaSwitcherBar` | Switching calls `setCurrentPersona` |

Mock `AppContext` — no real Supabase.

---

## Priority 5 — E2E (Playwright, future) ✅ Done 2026-04-21

| Journey | Why critical |
|---|---|
| Sign in with Google → dashboard | Auth is a single point of failure |
| Unapproved email → blocked | Core access control |
| Add person → appears in list | Primary shepherd workflow |
| Mark todo complete → removed | Core daily usage |
| Persona switch → data scope changes | Multi-shepherd correctness |

---

## Coverage targets

| Layer | Target |
|---|---|
| `utils.ts` | 90%+ |
| API routes | 100% branches |
| Zod schemas | 80%+ |
| Components | 60%+ |
| E2E | Journey-based (not line %) |

## What to skip

- `data.ts` seed data (no logic)
- `context.tsx` state wiring (test via component tests)
- Trivial display components (`PhotoAvatar`, `PageTransition`)
- Next.js routing itself (framework-tested)
