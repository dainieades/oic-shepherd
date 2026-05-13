# Tech Debt Audit — OIC Shepherd

_Last audited: 2026-04-22_

### Scoring: Priority = (Impact + Risk) × (6 − Effort)

---

## Phased Remediation Plan

**Backlog (plan before next major feature)**

- [ ] Split AppContext mutations into domain-scoped modules if the file grows beyond 1,500 lines again
- [ ] Add server-side pagination if dataset grows beyond ~1K people
- [ ] Desktop adaptation for detail pages (`/person/[id]`, `/family/[id]`, `/groups/[id]`) — two-column layout
- [ ] Desktop adaptation for list pages (Logs, Todos, Groups)
- [ ] PeopleTable polish: column visibility menu, density toggle, multi-select bulk actions
- [ ] `cmd/ctrl+K` keyboard shortcut to focus dashboard search
