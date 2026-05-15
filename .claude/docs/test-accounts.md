# Hidden Test Accounts

Three permanently-hidden test identities — one per role — let you preview the app from each user's perspective without polluting real congregation data.

## The accounts

| Email | Role | Linked person |
|---|---|---|
| `test-admin@oicshepherd.test`    | `admin`        | `test-person-admin`    |
| `test-shepherd@oicshepherd.test` | `shepherd`     | `test-person-shepherd` |
| `test-welcome@oicshepherd.test`  | `welcome-team` | `test-person-welcome`  |

All test people, the test family, and the test personas carry `is_test = true`. The app's context filters every row flagged `is_test` out of the view shown to non-test users, so they appear nowhere — not in the directory, search, family picker, shepherd dropdowns, dashboard counts, or access-settings personas list.

The `@oicshepherd.test` TLD is non-routable (reserved by RFC 2606) so these addresses can never collide with a real Gmail account.

## How `is_test` flows through the app

- DB columns: `people.is_test`, `personas.is_test`, `families.is_test`, `groups.is_test` (migration `20260513040000_add_is_test_flag.sql`).
- Mapped to `isTest?: boolean` on `Person`, `Persona`, `Family`, `Group` in [src/lib/types.ts](../../src/lib/types.ts).
- Helper `visibleTo()` in [src/lib/utils.ts](../../src/lib/utils.ts).
- Filtering happens once, in [src/lib/context.tsx](../../src/lib/context.tsx) — the exposed `data` is `visibleData`, computed from raw `data` + `currentPersona.isTest`. Notes/todos/notices referencing a hidden person or family are also stripped.
- Auto-link path in `loginWithSupabaseUser` reads `people.is_test` for the resolved person and mirrors it onto the persona it auto-creates, so first-time test sign-in immediately has the flag set.
- `addPerson`, `addFamily`, `addGroup` all stamp `is_test` onto new rows from `currentPersona.isTest` — anything a test user creates stays hidden.

## One-time setup (after the migrations run)

1. The migration `20260513050000_seed_test_accounts.sql` has already inserted the hidden test family, the three test people, and three `approved_emails` rows.
2. In the Supabase dashboard → **Authentication → Users → Add user**, create three users:
   - Email = each `*@oicshepherd.test` address above
   - Password = pick a strong one and store in your password manager
   - **Check "Auto Confirm User"** (the `.test` TLD doesn't accept email)
3. Sign in once as each in the running app. The auto-link path will create a persona for each.
4. In the SQL editor, stamp the correct role + flag on each new persona:

```sql
update personas set role = 'admin',        is_test = true where person_id = 'test-person-admin';
update personas set role = 'shepherd',     is_test = true where person_id = 'test-person-shepherd';
update personas set role = 'welcome-team', is_test = true where person_id = 'test-person-welcome';
```

After that, signing in as any of the three test emails will land on the matching test persona. To switch roles, sign out and sign in as a different test email.

## Recovery / re-flag SQL

If the personas table is ever wiped or a test persona loses its flag, the snippet above is enough to restore correct state — provided the auth user, the approved_email row, and the test person record still exist. If you nuked the test people too, re-run the seed migration with `supabase migration up` (it's idempotent — every insert is `on conflict do update set is_test = true`).
