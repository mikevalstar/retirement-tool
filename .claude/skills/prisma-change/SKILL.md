---
name: prisma-change
version: 1.0.0
description: >
  The required sequence for making Prisma schema changes in this project. Use
  this skill whenever the user asks to "add a database table", "update the
  schema", "add a column", "add a model", "change the Prisma schema", "modify
  the DB", or any time the data model needs to evolve. Skipping steps in the
  sequence causes stale type errors or silent runtime failures — use this skill
  to get the right order every time.
---

# Making a Prisma Schema Change

## The three-step sequence

Every schema change follows the same sequence. Never skip step 3 — stale
Prisma client types are a silent failure that produces confusing type errors
later.

```
1. Edit   prisma/schema.prisma
2. Push   pnpm db:push          (dev) or  pnpm db:migrate  (named migration)
3. Regen  pnpm db:generate
```

## Step 1 — Edit the schema

Schema file: `retirement-planner/prisma/schema.prisma`

```prisma
model InvestmentAccount {
  id        Int      @id @default(autoincrement())
  name      String
  type      String   // "brokerage" | "401k" | "ira" | "roth" | "hsa"
  balance   Float    @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Conventions used in this project:
- `id Int @id @default(autoincrement())` — integer PK
- `createdAt DateTime @default(now())` — on every model
- `updatedAt DateTime @updatedAt` — on mutable models
- Enums as `String` with inline comments (SQLite has no native enum type)
- Float for monetary values (this is a personal tool — precision is fine)

## Step 2a — Push (dev iteration)

```bash
pnpm db:push
```

Pushes the schema directly to the SQLite file without creating a migration
file. Use this when iterating quickly in development. Changes are not tracked
in version history. If you need to undo, edit the schema and push again.

## Step 2b — Migrate (tracked change)

```bash
pnpm db:migrate
```

Creates a versioned migration file under `prisma/migrations/` and applies it.
Use this when the schema change should be recorded — for instance, when the
model is stable and you want the migration in git history.

**When to use which:**
- `db:push` — actively designing a model, might change it again soon
- `db:migrate` — model is settled, want a repeatable migration (production path)

## Step 3 — Regenerate the Prisma client

```bash
pnpm db:generate
```

Regenerates the typed client from the current schema. The generated files land
in `src/generated/prisma/` (configured in `schema.prisma`). Always run this
after push or migrate, even if you only added a field — otherwise TypeScript
will still see the old shape.

## The Prisma singleton

The client is already instantiated in `src/db.ts`:

```ts
import { prisma } from '#/db'
```

Import it from there everywhere. Never create a new `PrismaClient()` instance
in route files or components — SQLite has a single-writer model and extra
connections cause lock errors.

## Seeding after schema changes

If the new model needs reference data or you want a working dev state:

```bash
pnpm db:seed
```

The seed script is at `prisma/seed.ts`. Add seed logic there before running.

## Common pitfall

Running `pnpm db:push` and then forgetting `pnpm db:generate` leaves the
Prisma client types out of sync with the actual database. The app may run but
TypeScript will error on the new fields, or worse, the client will silently
ignore them. Always run both commands.

## Checklist

- [ ] Schema edited in `prisma/schema.prisma`
- [ ] `pnpm db:push` (or `pnpm db:migrate` for a tracked migration) run successfully
- [ ] `pnpm db:generate` run to refresh the Prisma client types
- [ ] New model imported from `#/db` — no new `PrismaClient()` calls
- [ ] Seed script updated if the model needs initial data (`pnpm db:seed`)
- [ ] TypeScript check passes (`npx tsc --noEmit` from `retirement-planner/`)
