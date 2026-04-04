# Shepherd Care App — Product Requirements Document

> **Purpose of this document:** Provide full product and technical context for any developer or AI tool working on this codebase. Read this before making any changes.

---

## 1. Product Overview

**Shepherd Care** is a mobile-first pastoral care tracking tool for OIC (a Chinese-Canadian church). It helps shepherds, deacons, and pastoral staff stay connected with congregation members by logging interactions, managing follow-up to-dos, and tracking family and group relationships.

The app is a **private internal tool** — not public-facing. All data is stored in the browser (localStorage). There is no backend or authentication system; role-based access is simulated via a "persona switcher" in the dev bar.

---

## 2. Users & Personas

The app supports four **role-based personas** that control what data is visible:

| Role | Description | Access |
|---|---|---|
| **Admin** | Senior pastoral staff (e.g. Pastor Qing Liu) | Sees all notes (public + private), all people |
| **Shepherd** | Assigned shepherds (e.g. Elder David Park, Deacon Sarah Lin) | Sees their assigned people's public notes + their own private notes |
| **Welcome Team** | Front-of-house volunteers | Limited view; no private notes |

Each persona has:
- A name and role
- A list of `assignedPeopleIds` (who they shepherd)
- An optional `personId` linking them to a `Person` record

The active persona is persisted to `localStorage` and shown in the persona switcher bar at the top of every screen.

---

## 3. Core Concepts

### People
Each congregation member is a `Person` with:
- Names (English + Chinese), photo, gender, marital status, birthday, anniversary
- Contact info: phone, home phone, email, home address
- Church info: membership status, language preference, baptism date, membership date, church positions
- Relationship data: `familyId`, `groupIds[]`, `assignedShepherdIds[]`
- Follow-up tracking: `lastContactDate`, `nextFollowUpDate`
- Flags: `isShepherd`, `isFirstTimeVisitor`, `isChild`

**Membership statuses:** Member · Sunday Attendee · Fellowship Attendee · Membership Class · Archived

**Languages:** English · Chinese (Mandarin) · Bilingual

### Families
A `Family` groups adult members together:
- `memberIds[]` — adult members only (children are counted but not named)
- `childCount` — number of children
- `primaryContactId` — the main point of contact for the family
- `photo` — optional family photo (base64 stored in localStorage)
- `tags[]` — kept for data compat, no longer shown in UI (groups serve this purpose)
- Shepherds and fellowship groups are **derived** from the union of all members' assignments — not stored on the Family itself

### Fellowship Groups
A `Group` represents a small group or ministry team:
- `memberIds[]` — people in the group
- `leaderIds[]` — persona IDs of group leaders
- `relatedFamilyIds[]` — families associated with the group
- Both `Person.groupIds[]` and `Group.memberIds[]` are kept in sync

### Notes (Logs)
A pastoral contact record:
- **Types:** Check-in · Prayer Request · Event · General
- **Visibility:** Public (all shepherds with access can see) · Private (only creator + admin)
- **Contact methods:** In person · Call · Text · WeChat
- Can be linked to a person, a family, or both
- Creating a note auto-updates `lastContactDate` and recalculates `nextFollowUpDate`

### To-dos
A pastoral action item:
- **Types:** Task · Meeting · Message · Birthday · Anniversary
- Has optional due date, repeat frequency, and alert timing
- Can be linked to a person or family
- Completing a to-do prompts the user to log a follow-up note

---

## 4. Features

### People List (`/`)
- Scrollable list of all congregation members visible to the current persona
- Each row shows: avatar (initials + color palette or photo), name, Chinese name, membership status, last contact ago, overdue/due-soon indicator, group chips
- **Family rows:** house icon avatar (or family photo), family label, member count, group chips. The second line lists each adult member's first name; shepherd members show a small `HandHeart` icon (11px, sage) **immediately before their first name** (not next to the family name). Individual person rows show `HandHeart` next to the person's name in the list.
- Multi-filter panel: filter by shepherd assignment, membership status, and fellowship group
- Search by name (English or Chinese)
- Sort options: Priority · Last Contacted · Name · Group
- "Priority" sort puts overdue first, then due-soon, then by days overdue
- **Urgency color indicators:** left border red = overdue, amber = due soon (within 7 days)
- Tap a person → person detail page; tap a family → family detail page
- "+" button to add a new person (opens `AddPersonModal`)

### Person Detail (`/person/[id]`)
**Header (scrolls away):**
- 72px circular avatar (photo or initials); tap to upload/remove photo
- Name (English + Chinese), membership status, overdue/due text (no bold, colored), fellowship group chips (blue pills, tappable → group page)

**Tabs:**
- **Logs** — chronological note history, grouped by month, collapsible. Each log row shows type badge, time ago, content excerpt, author. Tap to edit.
- **To-dos** — categorized: Today · Upcoming · No Due Date · Completed. Toggle checkbox, tap to edit. Completing prompts a log entry.
- **Sheep** *(shepherds only)* — read-only list of assigned sheep (no remove button). Each row links to that person's detail page. Tapping back from a sheep's profile returns to the shepherd's Sheep tab (tab state is persisted in the URL as `?tab=sheep`). Sheep icon fills when active.
- **Info** — two card sections:
  - *Personal:* Language, Gender, Birthday, Marital Status, Anniversary, Phone, Home Phone, Email, Address, Medical Note
  - *Church:* Membership status + date, Baptism date, **Shepherd by** (HandHeart icon — shows assigned shepherds as chips), Is Shepherd toggle, Church Position, Fellowship Group (UsersFour icon)

**Sticky nav bar action button:**
- **Logs tab:** `+ Log` text button
- **To-dos tab:** `+ To-do` text button
- **Sheep tab:** `PencilSimple` icon + "Sheep" label → opens Edit Sheep modal (shows all people; current sheep highlighted + sorted first; toggling adds or removes)
- **Info tab:** `PencilSimple` icon + "Info" label → opens Edit Person drawer

**Back navigation:** Uses `router.back()` so navigating from a sheep's profile returns to the shepherd's Sheep tab (URL preserved).

**Edit drawer (`EditPersonDrawer`)** — full-height bottom sheet. Body background is `var(--bg)`. Each section (Basic, Personal, Church, Contact, Notes) is a white surface card with `overflow: hidden`. Rows use `field-row-hover` class. Sections:
- *Basic:* Name (required, asterisk left of icon), Chinese name
- *Personal:* Language, Gender, Birthday, Marital Status, Anniversary (married only)
- *Church:* Status, Member Since (member only), Baptism, Shepherd by (chips + picker), Is Shepherd (toggle), Position (chips + multi-select sheet)
- *Contact:* Phone, Home Phone, Email, Address
- *Notes:* Medical note

### Family Detail (`/family/[id]`)
**Header (scrolls away):**
- 72px house-icon avatar (or family photo); tap to upload photo
- Family label, member count ("2 adults · 2 kids"), fellowship group chips (tappable)

**Tabs:**
- **Logs** — same pattern as person detail
- **To-dos** — same pattern as person detail
- **Family Info** — two card sections:
  - *Members:* Clickable list of adult members (initials avatar, name, membership, last contact, due indicator) → links to each person's detail page. Children shown as a count row.
  - *Details:* Primary Contact, Fellowship Groups (UsersFour icon, blue chips), Shepherd (HandHeart icon, derived from members)

**Sticky nav bar action button:**
- **Logs/To-dos:** text buttons (`+ Log` / `+ To-do`)
- **Info tab:** `PencilSimple` icon + "Info" label → opens Edit Family drawer

**Edit drawer** — bottom sheet with:
- *Basic:* Family name (required)
- *Members:* List with remove (✕) button per member, "+ Add member" to add people
- *Church:* Primary contact picker (from current members), Fellowship Groups multi-select (sets all members), Shepherds multi-select (sets all members)

### Logs (`/logs`)
- All pastoral notes across all visible people, grouped by month
- Each entry shows type badge, person/family name, time ago, content, author
- Tap to edit a note; "+" button to add a new log
- Respects persona visibility rules

### To-dos (`/todos`)
- All to-dos visible to the current persona, grouped: Today · Upcoming · No Due Date · Completed
- Toggle completion (with log prompt); tap to edit
- "+" button to add a new to-do

### Add Log / Edit Log Modal (`AddLogModal`)
- Fields: Type, Who (person/family picker), Contact method, Date & time — all in a white surface card on `var(--bg)` body
- Note textarea below the card
- When editing: floating circular trash button at `bottom: 28; left: 24` (red-light bg, red-border) triggers `DeleteConfirmDialog` before deleting
- `DeleteConfirmDialog` is exported from `AddLogModal.tsx` and reused by other components

### Add To-do / Edit To-do Modal (`AddTodoModal`)
- Title textarea at top, then field card: For, Type, Date & time, Alert, Repeat — all in white surface card on `var(--bg)` body
- When editing: same floating trash button pattern as Add Log

### Add Person Modal (`AddPersonModal`)
- Full field parity with Edit Person drawer: Basic, Personal, Church, Contact, Notes sections
- Each section is a white surface card on `var(--bg)` body
- Required asterisk appears to the **left** of the row icon (not right)
- No "first visit" yes/no toggle; no loose notes textarea
- After save: success state with checkmark, auto-closes after 1.6s

### Fellowship Groups (`/groups`)
- "Fellowship Groups" heading (collapsing sticky header style)
- Each group card shows: name, member count, leader names, description excerpt, member avatar stack
- Tap → group detail page

### Group Detail (`/groups/[id]`)
- Group name, description, member count, leader count
- Member list with person details
- Leader list
- Related families

### Settings (`/settings`)
- **Profile row** — avatar (photo or initials), name, role icon (ShieldStar for admin, HandHeart for shepherd), role label. Tappable → `/settings/profile`
- **Account section** — Email row, Change Password row (in a `SettingsCard` with `no-last-border`)
- **Help section** — Help & Support row
- **Sign Out button** — triggers `DeleteConfirmDialog` before signing out (switches to first persona + navigates to `/`)
- No DEV persona switcher. No box shadow on section cards.

### Settings Profile (`/settings/profile`)
- **Sticky header** — ← Settings | My Profile | Save
- **Hero section** — avatar (72px circle) aligned left with camera badge for photo upload; name + Chinese name + membership status on right. No white background — sits directly on `var(--bg)`.
- **Form sections** — same sections as Edit Person drawer (Basic, Personal, Church, Contact, Notes). Each section has an uppercase label above a white surface card with `overflow: hidden` and `no-last-border`.
- Bottom nav is hidden on this page (added to `isDetail` exclusion in `BottomNav.tsx`)

---

## 5. Design System

### Visual Language
- **Mobile-first**, max content width ~430px, centered on wider screens
- Always **light mode** — `color-scheme: light` forced
- **Page background:** `#FAF8FC` (very light lavender)
- **Cards/surfaces:** `#FFFFFF`
- **Brand color:** Muted violet `#705A8C` (`--sage`)
- **Accent chips:** Blue `#6B8EAE` on `#EBF1F7` — used for group and tag chips
- **Urgency colors:** Red `#B85450`, Amber `#C9912B`

### CSS Design Tokens
```
--bg:               #FAF8FC   /* page background */
--surface:          #FFFFFF   /* cards, drawers, modals */
--border:           #DED7E5
--border-light:     #EDEAF1

--text-primary:     #1F2533
--text-secondary:   #4C5567
--text-muted:       #5C6470

--sage:             #705A8C   /* primary brand / interactive */
--sage-light:       #F2F0F5   /* selected/hover background */
--sage-mid:         #D9D2E0   /* outlines, focus rings */
--sage-dark:        #5C4778   /* hover/pressed */

--blue:             #6B8EAE   /* chips, group tags */
--blue-light:       #EBF1F7

--amber:            #C9912B   /* due soon */
--amber-light:      #FDF3E3
--red:              #B85450   /* overdue */
--red-light:        #FBF0EF

--radius-sm:        10px
--radius:           14px
--radius-lg:        18px
--radius-pill:      999px
```

### Interactive CSS Classes
- `.row-hover` — full-width row hover (non-card context, e.g. list pages)
- `.row-card-hover` — row inside a 16px-padded card; `display: block; width: 100%; padding: 0 16px`. Must NOT have `background: none` or `width: '100%'` inline style (inline styles override the CSS hover rule).
- `.field-row-hover` — edit drawer/modal field rows. Applies `margin: 0 -20px; width: calc(100% + 40px); padding: 0 20px`. Works two ways:
  1. Inside a **20px-padded modal body**: rows bleed to the body edge.
  2. Inside a **white section card with 16px internal padding + `overflow: hidden`**: rows extend 4px beyond each card edge, clipped by `overflow: hidden`, appearing edge-to-edge. Visible content padding is 16px from card edge.
  - **Critical:** Do NOT set `width: '100%'` as an inline style on any element using this class — the inline style overrides the CSS `width: calc(100% + 40px)` rule.
- `.picker-row` — picker sheet option rows (inset rounded hover)
- `.field-row-hover` — also applied to `div` wrappers for text inputs; hover state uses `var(--sage-light)` background, visible against the white section card background.
- `.no-last-border` — removes `border-bottom` from the last direct child (`> *:last-child { border-bottom: none !important }`). Applied to section card containers so the last row has no bottom divider.

### Component Patterns

**Cards (read-only lists):** `background: var(--surface); border-radius: 14px; padding: 0 16px` with `.no-last-border` to remove the last child's bottom border.

**Edit modal / drawer section cards:** `background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border-light); overflow: hidden; padding: 0 16px` with `className="no-last-border"`. The modal/drawer body behind the cards uses `background: var(--bg)` (light lavender).

**Edit modal field row layout:**
```
[10px asterisk/spacer] [16px icon] [60px label] [flex-1 value] [14px CaretRight]
```
- Asterisk: `color: var(--red); fontSize: 14` — required fields only; spacer otherwise
- Icon: Phosphor, `weight="regular"`, 16px, `color: var(--text-muted)`
- Label: `fontSize: 12; color: var(--text-muted); width: 60; flexShrink: 0`
- Value: `fontSize: 14; color: var(--text-primary)`; muted color when empty/placeholder
- Picker/date rows: `<button className="field-row-hover">` — no inline `width: '100%'`
- Text input rows: `<div className="field-row-hover">` wrapping `<input>` or `<textarea>`

**Chips/Pills:** `fontSize: 11; padding: 2px 7px; borderRadius: 999px; background: var(--blue-light); color: var(--blue); fontWeight: 600`. Group/tag chips are blue. Shepherd/status chips are sage.

**Sticky headers:** `position: sticky; top: 36px; zIndex: 40; background: var(--bg)`. The 36px accounts for the persona switcher bar height. Tab bars stick at `top: 90px` (36 + 54px nav bar).

**Bottom sheets/drawers:** `position: fixed; inset: 0; zIndex: 60; background: rgba(30,26,24,0.45)` backdrop. Sheet is `borderRadius: 20px 20px 0 0; height: calc(100dvh - 48px)`. Drag handle: `width: 36; height: 4; background: var(--border); borderRadius: 2; margin: 14px auto`.

**Floating delete button (edit modals):** `position: absolute; bottom: 28; left: 24; width: 44; height: 44; borderRadius: 50%; background: var(--red-light); border: 1.5px solid var(--red-border)`. Shown only when editing an existing record and the who-picker is not open. Tapping opens `DeleteConfirmDialog`.

**DeleteConfirmDialog:** Exported from `AddLogModal.tsx`. Fixed overlay (`zIndex: 80`), centered card `maxWidth: 320`, title + "This action cannot be undone." + Cancel/Delete button pair. Reused by `AddTodoModal`, `settings/page.tsx`.

**Icon library:** `@phosphor-icons/react` — key icons:
- People nav: `UserList`
- Groups nav: `UsersFour`
- To-dos nav: `CheckCircle`
- Logs nav: `Notepad`
- Settings nav: `Gear`
- Shepherd field: `HandHeart`
- Group field: `UsersFour`
- Admin role: `ShieldStar`
- Edit action: `PencilSimple`
- Camera badge: `Camera`
- Family avatar: house SVG (inline, not Phosphor)

---

## 6. Technical Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router, `'use client'` components throughout) |
| Language | TypeScript |
| Styling | Inline styles + global CSS classes (no CSS modules, no Tailwind utility classes beyond reset) |
| State | React Context (`AppProvider` in `lib/context.tsx`) |
| Persistence | `localStorage` with version key (`STORAGE_VERSION = 'v7'`) — bumped when seed data changes |
| Icons | `@phosphor-icons/react` |
| Fonts | System font stack (no custom fonts loaded) |

**Important:** This project uses a version of Next.js with breaking API changes from older versions. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code. Async params (`params: Promise<{ id: string }>`) are accessed with React's `use()` hook, not destructured directly.

---

## 7. Data Architecture

All data lives in a single `AppData` object in React Context, persisted to localStorage:

```typescript
AppData {
  people:   Person[]    // all congregation members
  families: Family[]    // family groupings
  groups:   Group[]     // fellowship groups / ministries
  notes:    Note[]      // pastoral contact logs
  todos:    Todo[]      // pastoral action items
  personas: Persona[]   // user roles/accounts
}
```

**Key relationships:**
- `Person.familyId` ↔ `Family.memberIds[]` (bidirectional, kept in sync by `updateFamilyMembers`)
- `Person.groupIds[]` ↔ `Group.memberIds[]` (bidirectional, kept in sync by `assignGroupsToFamily`)
- `Person.assignedShepherdIds[]` links to `Persona.id`
- `Note.createdBy` and `Todo.createdBy` link to `Persona.id`
- `Note.personId` / `Note.familyId` link logs to subjects

**Follow-up logic:** When a note is added for a person, `lastContactDate` is set to now and `nextFollowUpDate` = now + `followUpFrequencyDays`. The urgency is computed at render time: overdue if `nextFollowUpDate` < today, due-soon if < 7 days out.

---

## 8. Key UX Decisions & Constraints

1. **No tags on families** — Fellowship groups serve the categorization purpose. The `tags` field is kept in the data type for backward compatibility but is not shown or editable in the UI.

2. **Family-level shepherd/group editing** sets the same shepherd(s) and group(s) for ALL family members simultaneously. The read-only view shows the union of all members' assignments.

3. **Overdue/due-soon text** is the same weight as adjacent text, just a different color (red/amber). No bold.

4. **Group chips in detail headers** (both person and family) are clickable blue pills linking to the group detail page.

5. **`.row-card-hover` specificity rule:** Do NOT add `background: 'none'` or `width: '100%'` as inline styles on any element using `.row-card-hover`. Inline styles override the CSS hover rule due to specificity.

6. **`.field-row-hover` width rule:** Do NOT add `width: '100%'` as an inline style on any `<button>` using `.field-row-hover`. The CSS class provides `width: calc(100% + 40px)` which handles the negative-margin expansion. An inline `width: '100%'` overrides this and breaks the edge-to-edge border behavior. `<div>` elements are fine since they default to `width: auto` which auto-expands with negative margins.

7. **Family avatar** in the people list and detail header uses a house SVG icon (not Phosphor) on a `var(--sage-light)` background with a dashed `var(--sage)` border when no photo is uploaded.

8. **Camera badge** on avatar buttons (person + family detail, settings profile) is a small filled circle positioned `bottom: 0; right: 0`.

9. **Persona switcher bar** is always 36px tall and sticky at `top: 0`. All sticky content below it offsets by 36px. It is only shown in development/demo mode — the Settings page does NOT include a persona switcher.

10. **Bottom nav** hides on detail pages: `^\/(person|family|groups)\/[^/]+` pattern, plus explicitly on `/settings/profile`.

11. **Photo upload** uses `FileReader` to convert images to base64 data URLs stored directly in the data object (and thus localStorage). No file size limits are enforced.

12. **Tab state URL persistence** — The active tab on person detail pages is synced to the URL via `?tab=X` search param using `useSearchParams` + `router.replace(..., { scroll: false })`. This ensures `router.back()` from a sheep's profile returns to the shepherd's Sheep tab, not the default Logs tab.

13. **Shepherd label** — In the Church info section of person detail and all edit forms, the field is labeled "**Shepherd by**" (not "Shepherd") for clarity.

14. **Shepherd icon placement** — In the people list, `HandHeart` icon appears inline before each individual shepherd member's **first name** in the family member name line. It does NOT appear next to the family name itself. On individual person rows, it appears next to the person's name as usual.

15. **Edit modal visual structure** — All edit modals (EditPersonDrawer, AddPersonModal, AddLogModal, AddTodoModal) use `var(--bg)` as the scrollable body background. Form rows are grouped into white surface section cards (`var(--surface)`) with `overflow: hidden` and `no-last-border`. This makes hover states (sage-light) clearly visible against the white card background.

16. **Required field asterisk** — In add/edit forms, the required asterisk (`*`) is placed in a 10px-wide column to the **left** of the row icon, not after the label. Non-required rows use a 10px spacer in that column.

17. **Delete in edit modals** — The delete action is a floating circular icon button at `bottom: 28; left: 24` of the modal sheet (not in the header). Always requires a `DeleteConfirmDialog` confirmation. Only shown when editing an existing record.

---

## 9. Seed Data (Development Reference)

The app ships with realistic seed data representing a small Chinese-Canadian church. The storage version is `v7` — changing seed data requires bumping this constant in `lib/context.tsx` to force a reset.

**Personas:**
- Admin — Pastor Qing (Paul) Liu — 10 assigned people
- Shepherd 1 — Elder David Park — 4 assigned people
- Shepherd 2 — Deacon Sarah Lin — 4 assigned people
- Welcome — (no assigned people)

**10 People:** Long Chen, Fangyu Ai, David Park, Sarah Lin, Michael Tan, Grace Wu, Jay Song, Jennifer Lee, Qing Liu, Wei Zhang

**3 Families:** Chen Family (2 adults, 2 kids), Liu Family (1 adult, 1 kid), Park Family (1 adult)

**5 Groups:** Young Ladies, Youth Group, Mandarin Seniors, LIFe Group, Young Families

---

## 10. File Structure

```
src/
├── app/
│   ├── globals.css               # Design tokens, global classes, animations
│   ├── layout.tsx                # Root layout with AppProvider, PersonaSwitcherBar
│   ├── page.tsx                  # People list (main screen)
│   ├── logs/page.tsx             # All logs
│   ├── todos/page.tsx            # All to-dos
│   ├── groups/
│   │   ├── page.tsx              # Groups list
│   │   └── [id]/page.tsx         # Group detail
│   ├── person/[id]/page.tsx      # Person detail (tabs: Logs, To-dos, Sheep, Info)
│   ├── family/[id]/page.tsx      # Family detail
│   ├── settings/
│   │   ├── page.tsx              # Settings (profile row, account, help, sign out)
│   │   └── profile/page.tsx      # My Profile editor (avatar, all person fields)
├── components/
│   ├── BottomNav.tsx             # Fixed bottom navigation (hidden on detail + /settings/profile)
│   ├── AddPersonModal.tsx        # Create person modal (full field parity with edit drawer)
│   ├── EditPersonDrawer.tsx      # Edit person drawer (sectioned field rows)
│   ├── EditFamilyDrawer.tsx      # Edit family drawer
│   ├── AddLogModal.tsx           # Create/edit note modal (exports DeleteConfirmDialog)
│   ├── AddTodoModal.tsx          # Create/edit to-do modal
│   ├── TodoLogPrompt.tsx         # Post-completion log prompt
│   ├── PersonFamilyPicker.tsx    # Person/family search picker
│   ├── PersonaSwitcherBar.tsx    # Top persona bar (dev/demo only)
│   └── PickerMenu.tsx            # Generic single-select bottom sheet
└── lib/
    ├── types.ts                  # All TypeScript interfaces
    ├── context.tsx               # AppProvider, all data mutations
    ├── data.ts                   # Seed data (initialData)
    └── utils.ts                  # Helpers: getDueLabel, getTimeAgo, groupByMonth, etc.
```
