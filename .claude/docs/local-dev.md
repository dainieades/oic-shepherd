# Local Dev — Self-contained Supabase + Next.js

Your laptop runs a full Postgres + Supabase stack via Docker. The Next.js dev server points at it, not cloud. No data flows between local and cloud automatically.

## Daily commands

| What | Command |
|---|---|
| Start the stack | `supabase start` |
| Stop the stack (keeps data) | `supabase stop` |
| Stop + wipe Docker volumes | `supabase stop --no-backup` |
| Run the app | `npm run dev` |
| Reset DB to seed | `supabase db reset && ./scripts/local-bootstrap.sh` |
| Studio (DB GUI) | http://127.0.0.1:54323 |
| Mailpit (captured emails) | http://127.0.0.1:54324 |

## Test accounts

After every `supabase db reset` run `./scripts/local-bootstrap.sh` — it recreates the auth users and re-stamps the persona links that the reset wipes. Then sign in with any of:

| Email | Password | Role |
|---|---|---|
| `test-admin@oicshepherd.test` | `12312HSDHo` | admin |
| `test-shepherd@oicshepherd.test` | `qazpy5-zodwEc-vywkiv` | shepherd |
| `test-welcome@oicshepherd.test` | `vunGan-6xupdo-tyqcef` | welcome-team |

The `.test` TLD is RFC 2606 — non-routable, no real email delivery. These passwords are local-only and have no security implication; rotate via `scripts/local-bootstrap.sh` if you want different ones.

Test personas have `is_test = true` — they see **all** data (test + real); non-test personas only see non-test rows. Anything a test persona creates is auto-flagged `is_test = true`.

## Refresh schema or seed from cloud

When cloud has changes you want locally:

```
export SUPABASE_ACCESS_TOKEN=sbp_...               # one-time per shell; get at supabase.com/dashboard/account/tokens
supabase db dump --schema public -f supabase/migrations/$(date +%Y%m%d%H%M%S)_remote.sql   # only if schema changed
supabase db dump --data-only --schema public -f supabase/seed.sql                           # refresh data
supabase db reset && ./scripts/local-bootstrap.sh
```

## Switch back to cloud (rare)

```
cp .env.local .env.local.local         # back up local creds
cp .env.local.cloud .env.local         # restore cloud creds
npm run dev                            # now hits cloud
```

To switch back to local: `cp .env.local.local .env.local`.

## Gotchas

- **`supabase db reset` wipes `auth.users`.** Auth users aren't in the seed (which dumps only `public`). Always run `./scripts/local-bootstrap.sh` after a reset.
- **Auth emails go to Mailpit.** Signup confirmations, password resets, magic links, app emails — all captured at http://127.0.0.1:54324, never leave your laptop.
- **Google SSO is not enabled locally** by design. Use email/password. Prod's Google SSO is untouched.
- **`.env.local` switches your entire environment.** There's no per-request override. Make sure you know which one is active before running migrations from the CLI.
- **`.env.local.cloud` is your safety net** — restoring it points everything back at prod. Keep it.

## Local-only extras (`supabase/local-extras.sql`)

`supabase/local-extras.sql` is applied by `scripts/local-bootstrap.sh` after the seed loads. Use it for fixtures you want in every fresh local DB but not in cloud — currently a spread of mixed-urgency notices across ~8 people from different shepherds, useful for exercising notice rendering, filters, and dashboards.

Inserts must be idempotent (`ON CONFLICT (id) DO NOTHING`) so re-running the bootstrap is safe. The file is unaffected by `supabase db dump --data-only`, which only rewrites `seed.sql`.

## First-time setup (already done, recorded here for the next dev)

1. `brew install --cask docker-desktop` — launch and accept the "Continue without Rosetta" dialog (we don't need it on Apple Silicon for Supabase images)
2. `brew install supabase/tap/supabase`
3. `supabase init` — creates `supabase/config.toml`
4. `export SUPABASE_ACCESS_TOKEN=sbp_...` + `supabase link --project-ref nqaoktivshnfdyfxzlyu` (interactive: enter DB password)
5. `supabase db dump --schema public -f supabase/migrations/<timestamp>_initial.sql` — pulls cloud schema as initial migration
6. `supabase db dump --data-only --schema public -f supabase/seed.sql` — pulls cloud data as seed
7. `supabase start` (first run pulls ~1.5GB of Docker images; subsequent runs are fast)
8. Copy current `.env.local` → `.env.local.cloud` as a safety net, then rewrite `.env.local` to point at `http://127.0.0.1:54321` with the keys from `supabase status`
9. `./scripts/local-bootstrap.sh`
