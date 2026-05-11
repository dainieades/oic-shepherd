ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS calendar_sync_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS calendar_feed_token    TEXT,
  ADD COLUMN IF NOT EXISTS calendar_connected_app TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS personas_calendar_feed_token_idx
  ON personas (calendar_feed_token)
  WHERE calendar_feed_token IS NOT NULL;
