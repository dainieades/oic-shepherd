#!/usr/bin/env bash
# Bootstrap local Supabase auth users + persona links for the three hidden test accounts.
# Idempotent — safe to re-run after `supabase db reset`, which wipes auth.users
# and the user_id stamps on personas.
#
# Prereqs:
#   - `supabase start` is running (stack reachable at 127.0.0.1:54321)
#   - .env.local has SUPABASE_SERVICE_ROLE_KEY pointing at the local stack
#   - seed.sql has been applied (so the test personas exist with is_test = true)

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "ERROR: .env.local not found. Run 'supabase start' and swap to local env first." >&2
  exit 1
fi

SR=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2-)
if [ -z "$SR" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY missing from .env.local" >&2
  exit 1
fi

API="http://127.0.0.1:54321"
DB_CONTAINER="supabase_db_oic-shepherd"

if ! curl -fsS "$API/auth/v1/health" >/dev/null 2>&1; then
  echo "ERROR: $API/auth/v1/health unreachable. Run 'supabase start' first." >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  echo "ERROR: db container '$DB_CONTAINER' not running." >&2
  exit 1
fi

EMAILS=(
  "test-admin@oicshepherd.test"
  "test-shepherd@oicshepherd.test"
  "test-welcome@oicshepherd.test"
)
PASSWORDS=(
  "12312HSDHo"
  "qazpy5-zodwEc-vywkiv"
  "vunGan-6xupdo-tyqcef"
)
PERSONA_NAMES=(
  "test-admin"
  "test-shepherd"
  "test-welcome"
)

for i in "${!EMAILS[@]}"; do
  EMAIL="${EMAILS[$i]}"
  PASS="${PASSWORDS[$i]}"
  PNAME="${PERSONA_NAMES[$i]}"

  RESP=$(curl -sS -X POST "$API/auth/v1/admin/users" \
    -H "apikey: $SR" \
    -H "Authorization: Bearer $SR" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"email_confirm\":true}")

  USER_ID=$(printf '%s' "$RESP" | python3 -c "import json,sys
try: print(json.load(sys.stdin).get('id') or '')
except: print('')")

  if [ -z "$USER_ID" ]; then
    USER_ID=$(docker exec "$DB_CONTAINER" psql -U postgres -d postgres -t -A -c \
      "SELECT id FROM auth.users WHERE email = '$EMAIL';" | tr -d '[:space:]')
  fi

  if [ -z "$USER_ID" ]; then
    echo "ERROR: could not create or find auth user $EMAIL" >&2
    echo "Response was: $RESP" >&2
    exit 1
  fi

  ROWS=$(docker exec "$DB_CONTAINER" psql -U postgres -d postgres -t -A -c \
    "UPDATE public.personas SET user_id = '$USER_ID', email = '$EMAIL' WHERE name = '$PNAME' RETURNING id;")

  if [ -z "$ROWS" ]; then
    echo "WARN: no persona named '$PNAME' to stamp. Did the seed apply?" >&2
  fi

  echo "✓ $EMAIL → persona '$PNAME' (auth user_id $USER_ID)"
done

echo ""
echo "Bootstrap complete. Sign in with any of:"
for i in "${!EMAILS[@]}"; do
  echo "  ${EMAILS[$i]}  (password: ${PASSWORDS[$i]})"
done
