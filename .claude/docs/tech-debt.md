# Tech Debt Audit — OIC Shepherd

_Last audited: 2026-04-22_

### Scoring: Priority = (Impact + Risk) × (6 − Effort)

---

## Phased Remediation Plan

**Backlog (plan before next major feature)**

- [ ] Split AppContext mutations into domain-scoped modules if the file grows beyond 1,500 lines again
- [ ] Add server-side pagination if dataset grows beyond ~1K people
- ✅ 2026-05-17 Remove all inline styles: extended Tailwind config with `@theme inline` to expose all design tokens as utilities; swept all 85 src files replacing `style={{ … }}` props with Tailwind classes (1,308 → ~381 remaining, all legitimately dynamic)
