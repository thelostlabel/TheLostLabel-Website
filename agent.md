# Agent Instructions

## Current Task: JS → TS/TSX Migration

104 `.js` files under `app/` need to be converted to TypeScript.

Full plan: [docs/JS_TO_TS_MIGRATION.md](docs/JS_TO_TS_MIGRATION.md)

### Phase Status
| Phase | Scope | Files | Status |
|-------|-------|-------|--------|
| Faz 1 | API Routes: Admin | 17 | Pending |
| Faz 2 | API Routes: Public & Artist | 14 | Pending |
| Faz 3 | API Routes: Discord & Internal | 21 | Pending |
| Faz 4 | API Routes: Files, Cron, Misc | 18 | Pending |
| Faz 5 | Components | 9 | Pending |
| Faz 6 | Pages & Client Components | 25 | Pending |

### Rules
- API routes → `.ts`, Components/pages → `.tsx`, Utilities → `.ts`
- Add proper types, use existing types from `@/lib/`
- Do NOT change logic, only add types and rename
- Run `tsc --noEmit` after each phase to verify
