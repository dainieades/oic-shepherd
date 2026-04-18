# Design Tokens

All tokens are CSS custom properties defined in `src/app/globals.css` (`:root`). Never use hardcoded hex values. Light mode only.

## Colors

| Token | Purpose |
|---|---|
| `--bg` | Page background (lavender tint) |
| `--surface` | Cards, sheets, modals |
| `--border` | Normal borders |
| `--border-light` | Subtle dividers |
| `--text-primary` | Main text |
| `--text-secondary` | Secondary text |
| `--text-muted` | Muted/placeholder text |
| `--sage` | Brand primary (muted violet `#705A8C`) |
| `--sage-light` | Selected/active backgrounds |
| `--sage-mid` | Outlines, focus rings |
| `--sage-dark` | Hover/pressed states |
| `--blue` | Info / secondary action |
| `--amber` | Warning |
| `--red` | Error / danger |

## Spacing & Shape

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 10px | Small controls |
| `--radius` | 14px | Default cards/inputs |
| `--radius-lg` | 18px | Large surfaces |
| `--radius-pill` | 999px | Tags, badges |
| `--shadow-card` | — | Cards |
| `--shadow-elevated` | — | Modals, drawers |
