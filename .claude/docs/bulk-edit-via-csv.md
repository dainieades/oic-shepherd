# Bulk-Editing Supabase Data via CSV

How to let a non-technical helper review and edit data in a spreadsheet, then merge their corrections back into Supabase.

Supabase's CSV importer is **insert-only** — it cannot update existing rows. The workaround is a staging table + `UPDATE ... FROM`.

---

## Workflow

### 1. Export from Supabase

In the Table Editor, open the source table (e.g. `people`) and export as CSV.

Your CSV **must** include the primary key column (e.g. `id`). Without it there is nothing to match rows on.

### 2. Share with the helper

Open the CSV in Google Sheets. Lock or hide the `id` column so it can't be edited. The helper edits only the data columns.

### 3. Create a staging table

In the SQL Editor, create a regular table (not `temp` — temp tables vanish between SQL Editor runs and aren't visible to the Table Editor CSV importer).

```sql
create table people_import (
  id text,
  marital_status text
  -- add one column per field the helper edited
);
```

Notes:
- Match `id`'s type to the real table. In Shepherd, `people.id` is a **slug (`text`)**, not a `uuid`. Confirm by looking at a few rows.
- For non-`id` columns, `text` is fine even if the real column is an enum/date/etc. — the staging table is just a buffer.

### 4. Import the edited CSV into the staging table

- Table Editor → `people_import` → Import data from CSV.
- In the "Select which columns to import" step, pick only `id` + the columns being updated.
- Confirm the preview shows the right values in the right columns before clicking Import.

### 5. Preview the merge (read-only)

```sql
select p.id,
       p.marital_status as current,
       i.marital_status as new
from people p
join people_import i on p.id = i.id
where i.marital_status is not null
  and p.marital_status is distinct from i.marital_status;
```

Eyeball the diff. This is the safety net — if anything looks wrong, fix the CSV before running the UPDATE.

### 6. Run the UPDATE

```sql
update people p
set marital_status = i.marital_status
from people_import i
where p.id = i.id
  and i.marital_status is not null;
```

The `i.marital_status is not null` guard is **critical**. Without it, every blank cell in the helper's CSV would overwrite the existing value with NULL.

For multiple columns, repeat the pattern:

```sql
update people p
set marital_status = coalesce(i.marital_status, p.marital_status),
    phone          = coalesce(i.phone, p.phone)
from people_import i
where p.id = i.id;
```

`coalesce(new, old)` keeps the existing value when the CSV cell is blank.

### 7. Clean up

```sql
drop table people_import;
```

---

## Gotchas

- **CSV empty cells become empty strings, not NULL**, unless you tick "Set empty cells as NULL" in the import dialog for those columns. If you forget, use `nullif(i.col, '')` in the UPDATE.
- **Column-mapping by position**: if your CSV has more columns than the staging table, the importer can misalign them. Either trim the CSV to match, or expand the staging table to include every CSV column (extras can stay as `text`).
- **No transaction across SQL Editor runs**: Supabase's web SQL Editor auto-commits each query. Rely on the step 5 preview as your safety check rather than `BEGIN`/`ROLLBACK`.
- **Enum columns**: if you're updating a column with an enum type (e.g. `marital_status`), the helper's values must match the enum exactly (case-sensitive). Check the enum definition in `supabase/migrations/` first and brief the helper on allowed values.

---

## When NOT to use this

- One or two rows to fix → just edit them in the Table Editor.
- Rule-based change ("set all X to Y") → write the `UPDATE` directly, skip the CSV.
- Frequent recurring edits → build a review screen in Shepherd itself using existing context mutations (`updatePerson`, etc.) instead.
