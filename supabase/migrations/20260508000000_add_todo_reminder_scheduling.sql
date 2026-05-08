ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS reminder_due_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_todos_reminder_due
  ON todos (reminder_due_at)
  WHERE reminder_sent_at IS NULL AND completed = FALSE;
