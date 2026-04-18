-- Add privacy column to notices
-- 'pastor-only' | 'pastor-and-shepherds' | 'everyone'
alter table notices
  add column if not exists privacy text not null default 'pastor-and-shepherds';
