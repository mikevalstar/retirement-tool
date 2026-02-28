# TanStack Skills Plan

## Overview

After reviewing the TanStack documentation (https://tanstack.com/llms.txt), three project-specific skills are worth codifying. Each targets a repeatable, error-prone task where the wrong pattern is easy to reach for and hard to debug.

---

## Proposed Skills

### 1. `add-route`

**Location:** `.claude/skills/add-route/SKILL.md`

**Trigger phrases:** "add a route", "create a new page", "new route for X", "add the X section", "build out the X page"

**Problem it solves:** TanStack Router file-based routing has specific conventions that differ from other frameworks. Easy mistakes include: forgetting to let the dev server regenerate `routeTree.gen.ts`, wrong file naming for nested routes, incorrect `createServerFn` usage for server-only data access, using `useLoaderData()` instead of `Route.useLoaderData()`, and not wiring the section color / breadcrumb for new sections.

**What the skill covers:**
- File naming conventions for TanStack Router (directory-based, `index.tsx`, `$param.tsx` for dynamic segments)
- When to use a `loader` vs. a server function vs. client-side fetching
- How to write `createServerFn` correctly (import isolation, server-only code)
- `Route.useLoaderData()` vs. hook alternatives
- Wiring new routes into the Sidebar with section color and breadcrumb
- The `to={"/path" as any}` cast pattern for stub links
- Reminder to let the dev server regenerate `routeTree.gen.ts` (never edit manually)

---

### 2. `add-form`

**Location:** `.claude/skills/add-form/SKILL.md`

**Trigger phrases:** "add a form", "create a form for X", "build an input form", "form to add/edit X"

**Problem it solves:** TanStack Form with Zod has a different mental model than common React form libraries (React Hook Form, Formik). Mistakes include: importing `useForm` from the wrong package, incorrect validator adapter wiring, wrong `form.Field` render prop usage, and not handling async server submission errors properly.

**What the skill covers:**
- Correct `useForm` initialization with `@tanstack/react-form`
- Wiring a Zod schema via `zodValidator()` adapter
- The `form.Field` render prop pattern (not `register()`)
- Displaying field-level and form-level errors
- Handling async `onSubmit` that calls a `createServerFn`
- Controlled vs. uncontrolled field patterns
- Integrating with shadcn form primitives (`FormItem`, `FormLabel`, etc.)
- The `.num` class on any financial value output inside forms

---

### 3. `prisma-change`

**Location:** `.claude/skills/prisma-change/SKILL.md`

**Trigger phrases:** "add a database table", "update the schema", "add a column", "change the Prisma schema", "add a model", "modify the DB"

**Problem it solves:** Prisma schema changes require a specific sequence — edit the schema, then either migrate or push, then regenerate the client. Skipping steps causes type errors or silent stale client usage. The dev vs. prod distinction (db:push vs. db:migrate) also trips people up.

**What the skill covers:**
- The three-step sequence: edit `prisma/schema.prisma` → `pnpm db:push` (dev) or `pnpm db:migrate` (named migration) → `pnpm db:generate`
- When to use `db:push` vs. `db:migrate` (push = quick dev iteration, no migration file; migrate = creates a versioned migration)
- Reminder that the Prisma client singleton is in `src/db.ts` — no new instantiation needed
- Seeding considerations (`pnpm db:seed`) after schema changes in dev
- Common pitfall: forgetting `db:generate` after `db:push`, leaving types stale

---

## Why Not More Skills?

**TanStack AI** — Not worth a dedicated skill. AI use is intentionally sparse (one planned feature: merchant categorization). The pattern when needed is simple enough to describe inline. Revisit if AI features expand.

**TanStack Store / Jotai** — State management here is lightweight. No complex patterns have emerged yet that warrant a skill. Revisit once state usage grows.

**Styling / Design System** — Covered well in CLAUDE.md already. A skill would duplicate that documentation with little gain.

---

## Implementation Order

1. `add-route` — highest frequency task as the app is built out section by section
2. `add-form` — every CRUD section will need forms
3. `prisma-change` — needed any time the data model evolves

Each skill should be a single `SKILL.md` with frontmatter (`name`, `description`, `version`) and step-by-step instructions with examples drawn from actual project patterns.
