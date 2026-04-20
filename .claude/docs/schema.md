# OIC Shepherd — Entity & Schema Guide

_Last updated: 2026-04-20_

---

## The Persona / Person Duality (read this first)

The most confusing concept in the data model is that **a shepherd is two separate things**:

| Concept | Table | What it represents |
|---------|-------|--------------------|
| `Person` | `people` | A physical person in the congregation directory |
| `Persona` | `personas` | A login identity (an app user with a role) |

A shepherd who logs in has **both**:
- A `Person` row (their entry in the directory, with phone/birthday/etc.)
- A `Persona` row that links to `auth.users.id` via `personas.user_id` and back to their `Person` via `personas.person_id`

A congregation member who doesn't have app access has a `Person` row but **no** `Persona` row.

When you see `created_by text` in notes or todos, it is a **persona ID**, not a person ID.

---

## Entity Relationship Diagram

```
auth.users
    │ (user_id)
    ▼
personas ──────────────────────────────► people
    │  (person_id → people.id)           │   │
    │                                    │   │
    │  persona_people (join)             │   │  family_members (join)
    │  persona_id → personas.id          │   │  person_id → people.id
    │  person_id  → people.id            │   │  family_id → families.id
    │                                    │   │
    │  person_shepherds (join)           │   ▼
    │  person_id  → people.id           families
    │  shepherd_id = persona.id          │
    │                                    │  related_family_ids[] (denorm)
    ▼                                    ▼
notes ──────────────────────────────► groups
todos  (person_id or family_id)          │
notices                                  │  group_members (join)
    │                                    │  group_id  → groups.id
    │  created_by = persona.id           │  person_id → people.id
    │                                    │
    │                                    │  shepherd_ids[] (denorm)
    ▼
approved_emails (access control)
```

---

## Tables

### `people`
The directory of all congregation members, visitors, and shepherds.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `english_name` | text | |
| `chinese_name` | text | |
| `photo` | text | URL |
| `gender` | text | |
| `marital_status` | text | |
| `birthday` | text | YYYY-MM-DD |
| `baptism_date` | text | YYYY-MM-DD |
| `membership_date` | text | YYYY-MM-DD |
| `anniversary` | text | YYYY-MM-DD |
| `phone` / `home_phone` / `email` | text | |
| `home_address` | text | |
| `membership_status` | text | `member` \| `non-member` \| `membership-track` |
| `church_attendance` | text | `first-time-visitor` \| `regular` \| `on-leave` \| `fellowship-group-only` \| `archived` |
| `is_shepherd` | bool | denormalized flag for display |
| `church_positions` | text[] | free-form positions |
| `language` | text | |
| `family_id` | text | denormalized back-ref to `families.id` |
| `follow_up_frequency_days` | int | default 14 |
| `last_contact_date` / `next_follow_up_date` | timestamptz | |
| `is_first_time_visitor` / `is_child` | bool | |
| `is_being_discipled` | bool | added in remote_schema migration |
| `app_role` | text | `admin` \| `shepherd` \| `welcome-team` \| `no-access` |
| `physical_needs` / `spiritual_needs` | text | |
| `created_by` | text | persona ID of who added this person |
| `created_at` | timestamptz | |

> **Note:** `church_attendance` is the column name in code (`churchAttendance` in TypeScript). The value `'archived'` is how soft-deletion is modelled — archived people are filtered out of the default view.

---

### `families`
A household grouping of `Person` records.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `label` | text | display name (e.g. "The Smith Family") |
| `photo` | text | |
| `tags` | text[] | |
| `child_count` | int | |
| `primary_contact_id` | text | person ID |
| `created_by` | text | persona ID |
| `created_at` | timestamptz | |

Members are in `family_members` (join table). The TypeScript `Family` type denormalises `memberIds: string[]`.

---

### `family_members`
Join table: `family_id` × `person_id`.

---

### `groups`
Fellowship / small groups.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `name` | text | |
| `description` | text | |
| `leader_ids` | text[] | person IDs |
| `related_family_ids` | text[] | denormalised family IDs |
| `shepherd_ids` | text[] | persona IDs of shepherds for this group |

Members are in `group_members`. The TypeScript `Group` type denormalises `memberIds: string[]`.

---

### `group_members`
Join table: `group_id` × `person_id`.

---

### `personas`
App login identities. One row per user who can sign in.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `user_id` | uuid | FK → `auth.users.id`; null until they sign up |
| `name` | text | display name in the app |
| `role` | text | `admin` \| `shepherd` \| `welcome-team` |
| `person_id` | text | FK → `people.id` (the persona's own Person record) |

A `Persona` is the **app-side identity**. A `Person` is the **directory-side record**. When you need to show "who logged this note", you look up `personas` by `created_by`.

---

### `persona_people`
Which people a persona (shepherd) is responsible for.

| Column | Notes |
|--------|-------|
| `persona_id` | FK → `personas.id` |
| `person_id` | FK → `people.id` |

This is the source of truth for `currentPersona.assignedPeopleIds` in the app.

---

### `person_shepherds`
Reverse index: which personas shepherd a given person. Kept in sync with `persona_people`.

| Column | Notes |
|--------|-------|
| `person_id` | FK → `people.id` |
| `shepherd_id` | persona ID (not FK-enforced) |

Used to populate `person.assignedShepherdIds` in the TypeScript `Person` type.

---

### `notes`
Contact log entries. Can target a single person **or** a whole family (not both).

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `person_id` | text | FK → `people.id`; null if family note |
| `family_id` | text | FK → `families.id`; null if person note |
| `type` | text | `log` \| `prayer` \| `general` \| etc. |
| `visibility` | text | `private` \| `public` |
| `contact_method` | text | how the contact happened |
| `content` | text | |
| `mentions` | text[] | person IDs mentioned in the note |
| `created_by` | text | **persona ID** |
| `created_at` | timestamptz | |

RLS: private notes are only visible to their creator and admins. Public notes are visible to any shepherd who shepherds someone in that note.

---

### `todos`
Tasks associated with a person or family.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `person_id` / `family_id` | text | target (one or the other) |
| `todo_type` | text | |
| `title` | text | |
| `due_date` | timestamptz | |
| `repeat` / `alert` | text | |
| `completed` | bool | |
| `completed_at` | timestamptz | |
| `created_by` | text | **persona ID** |
| `created_at` | timestamptz | |

---

### `notices`
Short shared-awareness flags visible to all or some shepherds. Unlike notes, notices are always visible to a set of users (controlled by `privacy`).

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `person_id` / `family_id` | text | target |
| `category` | text | `physical-need` \| `spiritual-need` \| `other` |
| `urgency` | text | `urgent` \| `moderate` \| `ongoing` |
| `content` | text | |
| `privacy` | text | `pastor-only` \| `pastor-and-shepherds` \| `everyone` |
| `created_by` | text | **persona ID** |
| `created_at` | timestamptz | |

---

### `approved_emails`
Access control list. A user whose email is not in this table cannot use the app after signing in.

| Column | Notes |
|--------|-------|
| `email` | PK |
| `label` | optional display name |
| `created_at` | |

Admins manage this list via the Settings → Access page.

---

## Key Invariants

1. **`created_by` is always a persona ID** — never a person ID. To display the author's name, join to `personas`.

2. **Two-table shepherd assignment** — `persona_people` (shepherd → flock) and `person_shepherds` (person → shepherds) are denormalised mirrors. The `assignShepherds` mutation in `context.tsx` writes both atomically.

3. **Archived = `church_attendance === 'archived'`** — there is no `deleted_at` column; archiving is the soft-delete mechanism. The default filter hides archived people.

4. **`family_id` on `people`** — this is a denormalised back-reference. The canonical list of family members is `family_members`. The two should always agree; if they diverge, `family_members` wins.

5. **`person_id` on `personas`** — a persona doesn't strictly need a linked person (e.g. a welcome-team user who isn't in the directory). But shepherds and admins always have one.
