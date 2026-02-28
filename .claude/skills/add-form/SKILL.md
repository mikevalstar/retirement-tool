---
name: add-form
version: 1.0.0
description: >
  How to build forms in this project using TanStack Form. Use this skill
  whenever the user asks to "add a form", "create a form for X", "build an
  input form", "form to add/edit X", or any time fields, validation, and
  submission logic need to be wired together. TanStack Form has a different
  mental model from React Hook Form and Formik — use this skill proactively so
  the right imports, hook setup, and field pattern are used from the start.
---

# Adding a Form

## The project form hook

This project uses `createFormHook` to build a typed `useAppForm` hook with
pre-wired field components. The demo hook lives at
`src/hooks/demo.form.ts` — when building real app forms, create a parallel
hook in `src/hooks/` (e.g. `src/hooks/form.ts`) with the same pattern but
project-specific field components.

```ts
// src/hooks/form.ts
import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './form-context'
import { TextField, NumberField, Select, SubscribeButton } from '#/components/FormComponents'

export const { useAppForm } = createFormHook({
  fieldComponents: { TextField, NumberField, Select },
  formComponents: { SubscribeButton },
  fieldContext,
  formContext,
})
```

If a dedicated app hook doesn't exist yet, build it first rather than reaching
for raw `useForm` — the hook approach eliminates per-field boilerplate.

## Basic form setup

```tsx
import { useAppForm } from '#/hooks/form'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  balance: z.number().positive('Must be positive'),
})

function AddAccountForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useAppForm({
    defaultValues: { name: '', balance: 0 },
    validators: { onBlur: schema },   // Zod schema wired here — no adapter needed with createFormHook
    onSubmit: async ({ value }) => {
      await createAccount({ data: value })
      onSuccess()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.AppField name="name">
        {(field) => <field.TextField label="Account Name" />}
      </form.AppField>

      <form.AppField name="balance">
        {(field) => <field.NumberField label="Current Balance" />}
      </form.AppField>

      <form.AppForm>
        <form.SubscribeButton label="Save" />
      </form.AppForm>
    </form>
  )
}
```

Key points:
- `form.AppField` is the render-prop pattern — pass a function as children
- The child receives `field`, which exposes the typed field components
- `form.AppForm` wraps the submit button so it can subscribe to form state
  (disabling while submitting, showing errors, etc.)
- **Never use `register()`** — that's React Hook Form's API

## Per-field validation (beyond the Zod schema)

Add validators directly on `form.AppField` when a field needs extra logic:

```tsx
<form.AppField
  name="targetAllocation"
  validators={{
    onBlur: ({ value }) => {
      if (value < 0 || value > 100) return 'Must be 0–100'
      return undefined
    },
  }}
>
  {(field) => <field.NumberField label="Target Allocation (%)" />}
</form.AppField>
```

Return a string for an error, `undefined` for no error.

## Async server submission

`onSubmit` can be async. Call a `createServerFn` and handle errors:

```tsx
const form = useAppForm({
  defaultValues: { ... },
  validators: { onBlur: schema },
  onSubmit: async ({ value }) => {
    try {
      await saveAccount({ data: value })
      router.invalidate()    // re-run route loaders to reflect new data
    } catch (err) {
      form.setErrorMap({ onSubmit: 'Failed to save. Please try again.' })
    }
  },
})
```

## Financial value display inside forms

Any displayed dollar amount or financial figure inside a form (read-only totals,
running balances) must use the `.num` CSS class for JetBrains Mono tabular
rendering:

```tsx
<span className="num">{formatCurrency(balance)}</span>
```

Input fields for financial amounts should use a `NumberField` component with
`type="number"` under the hood. Don't format the raw input value — only format
on display.

## Styling forms to match the app shell

Forms live inside the dark surface hierarchy. Use `var(--surface)` for the
form card background, `var(--border)` for borders. Spacing via Tailwind
utilities (`gap-4`, `space-y-4`) is fine. Match the section accent color on
primary action buttons.

```tsx
<div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '20px 24px' }}>
  {/* form fields */}
</div>
```

## Checklist

- [ ] Import `useAppForm` from the project hook (`#/hooks/form`), not raw `useForm`
- [ ] `defaultValues` typed and complete (no undefined fields)
- [ ] Zod schema defined and wired via `validators: { onBlur: schema }`
- [ ] Each field uses `form.AppField` render-prop — not `register()`
- [ ] Submit button wrapped in `form.AppForm` + `form.SubscribeButton`
- [ ] `e.preventDefault()` and `e.stopPropagation()` in the form's `onSubmit`
- [ ] Financial display values use `.num` CSS class
- [ ] Server errors surfaced via `form.setErrorMap()`
- [ ] `router.invalidate()` called after successful mutation
