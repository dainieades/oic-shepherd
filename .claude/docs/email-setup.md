# Email Setup

The app sends two kinds of email. They use different systems and are configured separately.

| Kind | Examples | Sent by | Configured via |
|---|---|---|---|
| **App emails** | invites, notice-added, shepherd-assigned, person-updated, todo reminders | Our API routes via Gmail SMTP (nodemailer) | `GMAIL_USER` / `GMAIL_APP_PASSWORD` env vars |
| **Auth emails** | signup confirmation, password reset | Supabase Auth | Supabase Dashboard → Auth → SMTP Settings |

---

## App emails — how it works

All app emails flow through one helper: [src/lib/emails/mailer.ts](../../src/lib/emails/mailer.ts).

Call sites:
- [src/app/api/invite/route.ts](../../src/app/api/invite/route.ts) — invite a new email
- [src/app/api/notify/route.ts](../../src/app/api/notify/route.ts) — person/notice/shepherd/profile/todo notifications
- [src/app/api/cron/todo-reminders/route.ts](../../src/app/api/cron/todo-reminders/route.ts) — scheduled todo reminders

The mailer reads three env vars:

| Env var | Required | Purpose |
|---|---|---|
| `GMAIL_USER` | ✅ | The Gmail account doing the sending — must match the address that owns the app password |
| `GMAIL_APP_PASSWORD` | ✅ | 16-char [Google App Password](https://myaccount.google.com/apppasswords) (no spaces) |
| `GMAIL_FROM` | optional | Display address shown to recipients. Defaults to `GMAIL_USER` if unset |

> Gmail enforces a daily send cap of ~500 recipients per account. Fine for invites and notifications; not enough for parish-wide blasts.

---

## Changing the sender address

The sender Gmail account is purely env-driven — **no code changes needed**.

### Step 1 — Prepare the new Gmail account

1. Sign in to the new account (e.g. `oicinfoteam@gmail.com`).
2. Enable **2-Step Verification** (required for app passwords).
3. Visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → generate a new app password named "OIC Shepherd". Copy the 16-character value (strip spaces).

### Step 2 — Update env vars locally

In `.env.local`:

```
GMAIL_USER=oicinfoteam@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
```

Restart the dev server (Ctrl-C → `npm run dev`). Env vars are read on boot, not hot-reloaded.

### Step 3 — Update env vars on Vercel

1. Vercel Dashboard → project → **Settings → Environment Variables**.
2. Edit `GMAIL_USER` and `GMAIL_APP_PASSWORD` (Production + Preview + Development).
3. **Deployments tab → latest deployment → ⋯ → Redeploy.** Required: Vercel bakes env vars at build time, so just saving them doesn't update the running deployment.

### Step 4 — Verify

- Trigger an invite in the deployed app.
- Check the new account's **Sent** folder — the email should be there.
- If it doesn't arrive, check Vercel function logs for the failing route.

### Optional — sender display name

To show a friendly name instead of the bare address, set `GMAIL_FROM`:

```
GMAIL_FROM=OIC Shepherd <oicinfoteam@gmail.com>
```

The address inside `<…>` must match `GMAIL_USER` (Gmail rejects mismatches as a relay attempt).

---

## Auth emails (Supabase) — separate concern

Password reset and signup confirmation go through Supabase, **not** our mailer. By default Supabase uses its built-in service with a strict rate limit (a few emails per hour). For production traffic, point Supabase at the same Gmail account:

**Supabase Dashboard → Project Settings → Auth → SMTP Settings:**

- Host: `smtp.gmail.com`
- Port: `465` (SSL) or `587` (TLS)
- Username: same as `GMAIL_USER`
- Password: same app password
- Sender email: same as `GMAIL_USER`
- Sender name: e.g. `OIC Shepherd`

When you change the Gmail account, update this too — otherwise reset/confirmation emails still go from the old address.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Resend testing-domain error appears | Old deployment still running. Redeploy on Vercel after env vars are set |
| `GMAIL_USER and GMAIL_APP_PASSWORD must be set` error in logs | One of the env vars is missing in that environment |
| `Invalid login: 535-5.7.8` from Gmail | App password is wrong, has spaces, or 2-Step Verification is off on the sender account |
| Emails sent successfully (200 from API) but never arrive | Check spam folder; check the sender account's **Sent** folder to confirm it left Gmail |
| Auth emails (reset/confirm) still come from old address | Supabase SMTP settings weren't updated — see section above |
