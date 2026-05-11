ALTER TABLE public.notes
  ADD COLUMN todo_id text REFERENCES public.todos(id) ON DELETE SET NULL;

CREATE INDEX idx_notes_todo_id ON public.notes(todo_id) WHERE todo_id IS NOT NULL;
