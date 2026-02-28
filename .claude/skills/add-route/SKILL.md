---
name: add-route
version: 1.0.0
description: >
  Step-by-step guide for adding new pages and routes in this TanStack Router
  file-based project. Use this skill whenever the user asks to "add a route",
  "create a new page", "build out the X section", "add a page for X", or any
  time a new URL path or view needs to be created. TanStack Router has specific
  conventions that differ from other frameworks — use this skill proactively to
  avoid the common pitfalls around file naming, loader data access, server
  functions, and sidebar wiring.
---

# Adding a Route

## File naming conventions

Routes live in `retirement-planner/src/routes/`. TanStack Router uses the file
path to derive the URL, with these naming rules:

| File | URL |
|---|---|
| `src/routes/income/index.tsx` | `/income` |
| `src/routes/income/employment.tsx` | `/income/employment` |
| `src/routes/income/$id.tsx` | `/income/:id` (dynamic segment) |
| `src/routes/income/$id.edit.tsx` | `/income/:id/edit` |

Use **`index.tsx`** for the section landing page. Use **`$param.tsx`** for
dynamic segments. Dots in the filename map to path segments — `form.simple.tsx`
→ `/form/simple`.

Never edit `src/routeTree.gen.ts` — it is auto-generated on dev-server start
and on build.

## Minimal route file

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/income/')({ component: IncomePage })

function IncomePage() {
  return (
    <div style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* page content */}
    </div>
  )
}
```

The string passed to `createFileRoute` must exactly match the file's derived
path (the dev server will warn if it doesn't).

## Section header pattern

Every section page uses the colored accent bar + h1 pattern from existing pages.
Pick the CSS var for the section from CLAUDE.md:

```tsx
const ACCENT = 'var(--section-income)'   // use the correct section var
const ACCENT_HEX = '#14b8a6'             // used for color-mix() calls

// Inside the component:
<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
  <div style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: ACCENT }} />
  <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
    Income
  </h1>
</div>
```

Section color map (from CLAUDE.md):
- dashboard `#06b6d4`, investments `#10b981`, income `#14b8a6`
- expenses `#f59e0b`, housing `#6366f1`, taxes `#f97316`
- scenarios `#8b5cf6`, simulation `#00e5ff`

## Loading data in a route

Use a `loader` on the route for server-side data fetching. The loader runs on
the server (or during SSR) and must call a `createServerFn` — don't import
Prisma directly into a route file.

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '#/db'

const getAccounts = createServerFn({ method: 'GET' }).handler(async () => {
  return await prisma.investmentAccount.findMany()
})

export const Route = createFileRoute('/investments/accounts')({
  component: AccountsPage,
  loader: async () => await getAccounts(),
})

function AccountsPage() {
  const accounts = Route.useLoaderData()   // ← always Route.useLoaderData(), not useLoaderData()
  // ...
}
```

**`Route.useLoaderData()`** — not the free `useLoaderData()` hook. This is the
most common mistake; the free hook requires extra type wiring that isn't needed.

## createServerFn rules

- Define server functions in the same file as the route, or in a dedicated
  `src/lib/` or `src/data/` file. Never in a shared component file.
- Only import server-only modules (Prisma, fs, env vars) inside the `.handler()`
  callback. The function boundary is the isolation point.
- Use `.inputValidator()` to validate POST payloads before the handler runs.
- Call `router.invalidate()` after a mutation to re-run loaders.

```tsx
const createAccount = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string; type: string; balance: number }) => data)
  .handler(async ({ data }) => {
    return await prisma.investmentAccount.create({ data })
  })
```

## Stub / placeholder links

For routes that exist in the sidebar but whose page isn't built yet, cast the
`to` prop to silence the type error:

```tsx
<Link to={"/income/passive-streams" as any}>Passive Streams</Link>
```

## Wiring into the Sidebar

`src/components/Sidebar.tsx` contains the `NAV` array. To add a new section:

```ts
{
  id: 'income',
  label: 'Income',
  icon: Wallet,           // import from lucide-react
  color: '#14b8a6',       // hex for the section
  path: '/income',
  children: [
    { label: 'Employment', path: '/income/employment' },
    { label: 'Social Security', path: '/income/social-security' },
  ],
},
```

To add a child to an existing section, append to its `children` array.

## Checklist

- [ ] Created route file in the correct location with the correct path string
- [ ] Section accent color (`ACCENT` / `ACCENT_HEX`) matches the section
- [ ] Data fetched via `createServerFn` in a loader, not directly in the component
- [ ] Loader data accessed with `Route.useLoaderData()`
- [ ] Sidebar `NAV` array updated if this is a new section or new child link
- [ ] Unregistered `to` props cast with `as any`
- [ ] Dev server restarted (or already running) to regenerate `routeTree.gen.ts`
