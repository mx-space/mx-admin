# 08 · Form System

**Date**: 2026-05-06
**Owner spec**: [00-roadmap.md](./00-roadmap.md)
**Phase**: P2
**Status**: P2 core shipped 2026-05-10 (Form / FormField / FormFieldArray / FormLabel / FormMessage / FormSection + Textarea primitive). Form library swapped from `react-hook-form` → `@tanstack/react-form` on 2026-05-10. ConfigForm DSL renderer deferred to P3 (depends on real `/setting` descriptors).
**Depends on**: 03 (Input, Textarea, Select, Switch, Checkbox, Radio), 02 (tokens for spacing / typography)
**Feeds**: 11 (every CRUD view), 06 (login form), 09 (write-editor metadata drawer)

Defines the form binding layer (`@tanstack/react-form` + `zod` via Standard Schema), the field-renderer registry, and the port plan for the existing dynamic-form DSL used in `/setting`. The system serves both static forms (login, project create) and the runtime-schema-driven forms (settings panels, snippet metadata, friend application form).

---

## Scope

- **In**: form library choice, schema-validation contract, field-renderer registry, ConfigForm DSL port, error-state rendering, submit behavior, dirty/touched semantics, dynamic field arrays (kv-editor, dynamic-tags), file-input handling shell.
- **Out**: Upload component internals (covered in 11 — `manage-files`), Table column form (in 12), specific view forms (composed inside 11).

---

## Decisions

- **`@tanstack/react-form` + zod via Standard Schema.** Zod 4's Standard Schema output plugs into `validators.onChange` / `onSubmit` directly — no resolver package needed. We migrated off `react-hook-form` on 2026-05-10 to align the data + state stack on TanStack (Query, Form, Table). Cost: render-prop API is slightly different; payoff: shared mental model with the rest of the data layer, smaller bundle, first-class array fields, Subscribe-based selective re-renders.
- **One canonical wrapper component per primitive.** `<FormField>`, `<FormLabel>`, `<FormMessage>`, `<FormSection>`, `<FormFieldArray>`. They wire `form.Field` / `form.Subscribe` from TanStack Form to our UI primitives. There is no separate `<FormControl>` — controls are user-rendered inside `<FormField>`'s render-prop.
- **Schemas live next to the form.** No central schema repo; each form owns its zod schema (or imports a shared one from `~/models/schemas/*` when reuse is genuine).
- **Runtime schemas (`/setting`) ship a `FormFieldRenderer`** that consumes the source's existing form descriptor JSON. The descriptor is converted to zod at runtime; values flow through the same `@tanstack/react-form` machinery.
- **No `<form>` without zod.** Even simple forms (login) declare a schema. Cost is low, payoff (consistent error rendering) is high.

---

## File layout

```
src/components/form/
├── Form.tsx                   # form-context provider + handleSubmit + root-error banner
├── FormField.tsx              # form.Field + label + control + message
├── FormLabel.tsx
├── FormMessage.tsx            # standalone error reader for a named field
├── FormSection.tsx            # spacing wrapper, optional title/description
├── FormFieldArray.tsx         # form.Field mode="array" wrapper for kv / tags / repeats
├── stringifyError.ts          # normalises Standard Schema / string / object errors
├── ConfigForm/                # runtime DSL renderer (P3)
│   ├── index.tsx              # ConfigFormRenderer
│   ├── descriptorToSchema.ts  # converts descriptor → zod
│   ├── fieldRegistry.ts       # type → renderer map
│   └── renderers/             # text, number, switch, select, kv-editor, ...
└── form.css.ts
```

---

## Static form pattern

```tsx
// example: project-create form
import { useForm } from '@tanstack/react-form'

const schema = z.object({
  name: z.string().min(1, '名称不能为空').max(80),
  url: z.url('请输入合法的 URL'),
  description: z.string().max(200).optional(),
  hidden: z.boolean(),
})

type ProjectFormValues = z.infer<typeof schema>

export function ProjectForm({
  initial,
  onSubmit,
}: {
  initial?: ProjectFormValues
  onSubmit: (v: ProjectFormValues) => Promise<void>
}) {
  const form = useForm({
    defaultValues: initial ?? { name: '', url: '', description: '', hidden: false },
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: ({ value }) => onSubmit(value),
  })

  return (
    <Form form={form}>
      <FormField<ProjectFormValues, 'name'> name="name" label="名称" required>
        {({ field, invalid }) => (
          <Input {...field} invalid={invalid} placeholder="项目名称" />
        )}
      </FormField>
      <FormField<ProjectFormValues, 'url'> name="url" label="URL" required>
        {({ field, invalid }) => (
          <Input {...field} invalid={invalid} placeholder="https://..." />
        )}
      </FormField>
      <FormField<ProjectFormValues, 'description'> name="description" label="说明">
        {({ field, invalid }) => (
          <Textarea {...field} invalid={invalid} rows={3} />
        )}
      </FormField>
      <FormField<ProjectFormValues, 'hidden'> name="hidden" label="隐藏" inline>
        {({ field, fieldApi }) => (
          <Switch
            checked={Boolean(field.value)}
            onCheckedChange={(checked) => fieldApi.handleChange(checked)}
          />
        )}
      </FormField>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" intent="primary" loading={isSubmitting}>
            保存
          </Button>
        )}
      </form.Subscribe>
    </Form>
  )
}
```

`<FormField>` is a render-prop wrapper around `form.Field`. The render arg gives `{ field, invalid, errors, fieldApi, id }` — `field` is a spread-friendly bag (`{name, value, onChange, onBlur, id, aria-invalid, aria-describedby}`) compatible with our `<Input>` / `<Textarea>` primitives; `fieldApi` is the raw TanStack `FieldApi` for advanced cases (push/swap/setMeta/...).

`<Form>` provides a React context carrying the form API, calls `form.handleSubmit()` on the form's submit event, and renders a root-error banner when `form.state.errorMap.onSubmit` (or `onServer`) is populated. The `onSubmit` callback lives in `useForm`'s config (TanStack convention), not on `<Form>`.

Server-derived errors: from your `onSubmit` callback, throw a `BusinessError` that the caller wraps, or call `form.setErrorMap({ onServer: { fields: { foo: 'msg' }, form: 'top-level msg' } })` after a failed mutation. The banner reads `state.errorMap.onSubmit ?? state.errorMap.onServer`.

---

## Field renderers (registry)

```ts
// src/components/form/ConfigForm/fieldRegistry.ts
type FieldRenderer = (props: {
  name: string
  descriptor: FieldDescriptor
}) => ReactNode

export const fieldRegistry: Record<string, FieldRenderer> = {
  text: TextRenderer,
  number: NumberRenderer,
  textarea: TextareaRenderer,
  switch: SwitchRenderer,
  checkbox: CheckboxRenderer,
  radio: RadioRenderer,
  select: SelectRenderer,
  multiselect: MultiSelectRenderer,
  date: DateRenderer,
  kv: KVRenderer,
  tags: TagsRenderer,
  upload: UploadRenderer,
  json: JSONRenderer,
  monaco: MonacoRenderer,
  color: ColorRenderer,           // delegates to a deferred ColorPicker
  custom: CustomRenderer,         // descriptor.render escape hatch
}
```

A view extending the registry locally:

```tsx
const renderers = useMemo(() => ({ ...fieldRegistry, customWidget: MyWidget }), [])
<ConfigFormRenderer descriptor={schema} renderers={renderers} />
```

---

## ConfigForm DSL port

Source repo's `/src/components/config-form/` consumes a JSON descriptor like:

```json
{
  "groupKey": "seo",
  "fields": [
    { "key": "title", "type": "text", "label": "默认标题", "required": true },
    { "key": "keywords", "type": "tags", "label": "关键词" },
    { "key": "showFloor", "type": "switch", "label": "显示楼层", "default": true,
      "showWhen": { "field": "enableComments", "equals": true } }
  ]
}
```

### Descriptor → zod converter

```ts
// src/components/form/ConfigForm/descriptorToSchema.ts
export function descriptorToSchema(fields: FieldDescriptor[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of fields) {
    let z_ = primitiveSchemaForType(f.type)
    if (f.required) z_ = z_
    else z_ = z_.optional()
    if (f.default !== undefined) z_ = z_.default(f.default)
    shape[f.key] = z_
  }
  return z.object(shape)
}
```

Strict typing requires per-type primitives; runtime descriptors lose the type info that static zod usually carries, so `ConfigForm` accepts `Record<string, unknown>` values.

### Conditional fields (`showWhen`)

`<ConfigFormRenderer>` subscribes via `form.Subscribe` to the dependency value and conditionally mounts the field. Conditional fields are not required in the schema even if marked `required: true` when their condition is false — the converter applies a `superRefine` that only validates when the dependency holds.

### Live-editing UX

`/setting` saves on blur per-field (mirrors source). Implementation: each renderer invokes a debounced `onSave(value)` after blur if the field's `state.meta.isDirty` is true. The wrapper component owns the API call and toast.

Alternative: explicit "Save" button per group. Source uses field-level autosave; preserve unless P1 reveals UX regressions.

---

## Field arrays

`<FormFieldArray name=…>` wraps `form.Field name=… mode="array"` for repeated structures: `kv-editor` (key-value pairs), `dynamic-tags`, repeated webhook headers, etc.

```tsx
// src/components/form/FormFieldArray.tsx (sketch)
export function FormFieldArray<T, N>({ name, render }) {
  const form = useFormApi()
  return (
    <form.Field name={name} mode="array">
      {(field) =>
        render({
          field,
          items: field.state.value,
          pushValue: (v) => field.pushValue(v),
          removeValue: (i) => field.removeValue(i),
          swapValues: (a, b) => field.swapValues(a, b),
          moveValue: (from, to) => field.moveValue(from, to),
          insertValue: (i, v) => field.insertValue(i, v),
        })
      }
    </form.Field>
  )
}
```

`<KVEditor>` (consumer):

```tsx
<FormFieldArray<Values, 'headers'> name="headers" render={({ items, pushValue, removeValue }) => (
  <div className={styles.kv}>
    {items.map((_, i) => (
      <div key={i} className={styles.row}>
        <FormField<Values, `headers.${number}.key`> name={`headers.${i}.key`}>
          {({ field }) => <Input {...field} />}
        </FormField>
        <FormField<Values, `headers.${number}.value`> name={`headers.${i}.value`}>
          {({ field }) => <Input {...field} />}
        </FormField>
        <Button intent="tertiary" onClick={() => removeValue(i)} aria-label="删除">×</Button>
      </div>
    ))}
    <Button intent="tertiary" onClick={() => pushValue({ key: '', value: '' })}>添加</Button>
  </div>
)} />
```

---

## Error rendering

- Field-level: `<FormField>` renders the first error inline (`field.state.meta.errors[0]`). For ad-hoc placement, `<FormMessage name="..." />` subscribes to a single field's first error and renders below.
- Form-level: `form.setErrorMap({ onSubmit: 'msg' })` from the submit handler — `<Form showRootError>` (default true) renders a banner above the body when `state.errorMap.onSubmit` or `state.errorMap.onServer` is set.
- Server-derived: when the API returns `BusinessError` with field-specific issues, the submit wrapper maps `error.raw.fields[k]` → `form.setFieldMeta(k, (m) => ({ ...m, errors: [{ message }] }))` per field, plus `form.setErrorMap({ onServer: { form: error.message } })` for the banner.

---

## Dirty / touched / submit behavior

- **Dirty tracking**: subscribe to `form.state.isDirty` (or per-field `state.meta.isDirty`). Save buttons read it via `form.Subscribe selector={(s) => s.isDirty}`.
- **Block navigation on dirty**: views call `useBlocker(isDirty)` (port from source's `beforeRouteLeave` pattern). Confirms before navigating away.
- **Reset after save**: `form.reset()` (or `form.reset(form.state.values)`) clears dirty without losing values.
- **Submit on Enter** is the browser default — keep. Use `<Button type="button">` for non-submit actions.

---

## File-input handling (shell)

`UploadRenderer` (registry) wraps the future Upload component (spec 11 — manage-files):

```tsx
function UploadRenderer({ name, descriptor }: RendererProps) {
  return (
    <FormField name={name} label={descriptor.label}>
      {({ field, fieldApi }) => (
        <Upload
          accept={descriptor.accept}
          multiple={descriptor.multiple}
          value={field.value}
          onChange={(value) => fieldApi.handleChange(value)}
        />
      )}
    </FormField>
  )
}
```

`Upload` itself manages the actual file → URL pipeline (POST to file API, return URL). The form sees only the resulting URLs / IDs.

---

## Acceptance for spec 08

### P2 acceptance

1. `Form`, `FormField`, `FormLabel`, `FormMessage`, `FormSection`, `FormFieldArray` exist and pass smoke tests. (No separate `<FormControl>` — controls render inside `<FormField>`.)
2. A static `ProjectForm` example renders, validates with zod via `validators.onChange / onSubmit`, submits, and round-trips dirty / reset state.
3. `ConfigFormRenderer` consumes a sample descriptor (port one `/setting` group) and renders the right fields with the right defaults.
4. `descriptorToSchema` produces a valid zod schema; conditional `showWhen` fields validate correctly.
5. `useBlocker(isDirty)` prevents navigation when the form has unsaved changes (smoke test).
6. Field-level autosave (per `/setting` semantics) debounces correctly.

---

## P2 core · 2026-05-10 (shipped, then re-shipped on @tanstack/react-form)

The first wave covers static forms only. ConfigForm DSL ships in P3 alongside `/setting`.

**Files**

```
src/components/form/
├── Form.tsx              # form-context provider + handleSubmit + root-error banner
├── FormField.tsx         # form.Field + label + control + message wiring
├── FormLabel.tsx         # Renders `<label>` with optional required-marker
├── FormMessage.tsx       # Subscribes to a single field's first error
├── FormSection.tsx       # Title + description block, hairline divider on bottom
├── FormFieldArray.tsx    # Sugar over `form.Field name=… mode="array"`
├── stringifyError.ts     # Normalises Standard Schema / string / object errors
├── form.css.ts
└── index.ts              # Barrel
```

**API**

```tsx
import { useForm } from '@tanstack/react-form'

const schema = z.object({
  name: z.string().min(1, '名称不能为空').max(80),
  url: z.url('请输入合法的 URL'),
  description: z.string().max(200).optional(),
  hidden: z.boolean(),
})
type Values = z.infer<typeof schema>

function ProjectForm() {
  const form = useForm({
    defaultValues: { name: '', url: '', description: '', hidden: false } as Values,
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: ({ value }) => console.log(value),
  })
  return (
    <Form form={form}>
      <FormSection title="项目" description="…">
        <FormField<Values, 'name'> name="name" label="名称" required>
          {({ field, invalid }) => <Input {...field} invalid={invalid} />}
        </FormField>
        <FormField<Values, 'description'> name="description" label="说明">
          {({ field, invalid }) => <Textarea {...field} invalid={invalid} rows={3} />}
        </FormField>
        <FormField<Values, 'hidden'> name="hidden" label="隐藏" inline>
          {({ field, fieldApi }) => (
            <Switch
              checked={Boolean(field.value)}
              onCheckedChange={(checked) => fieldApi.handleChange(checked)}
            />
          )}
        </FormField>
      </FormSection>
      <form.Subscribe selector={(s) => s.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" intent="primary" loading={isSubmitting}>
            保存
          </Button>
        )}
      </form.Subscribe>
    </Form>
  )
}
```

Notes:

- `<FormField>` is generic over `<Values, FieldName>` — it keeps `field.value` strongly typed against the schema.
- The render-prop receives `{ field, invalid, errors, fieldApi, id }`. `field` carries `value`, `onChange`, `onBlur`, plus a generated `id`, `aria-invalid`, and `aria-describedby` so primitives stay accessible without manual wiring. `field.onChange` accepts both React change events (extracts `target.value` / `target.checked` / `target.valueAsNumber`) and bare values.
- `fieldApi` is the raw TanStack `FieldApi` — use it for `handleChange`, `pushValue`, `setMeta`, `state.meta.isDirty`, etc.
- `inline` flag puts the label and control on a single row — typical for `Switch` / `Checkbox`.
- Boolean primitives (`Switch`, `Checkbox`) prefer `checked` / `onCheckedChange`. Use `<Switch checked={Boolean(field.value)} onCheckedChange={(c) => fieldApi.handleChange(c)} />`.
- Submission state: don't read `form.state.isSubmitting` directly inside `<Form>` body unless you also wrap in `<form.Subscribe>` — bare reads won't re-render. Subscribe with a selector for selective re-render.
- Server-derived errors: call `form.setErrorMap({ onServer: 'msg' })` (form-level) or `form.setFieldMeta(name, m => ({ ...m, errors: [{ message }] }))` (per field). `<Form showRootError>` reads `state.errorMap.onSubmit ?? state.errorMap.onServer`.
- `<FormFieldArray name="…" render={({ items, pushValue, removeValue, swapValues, moveValue, insertValue, field }) => …}>` exposes array helpers; UI is consumer-defined (kv-editor, repeating headers, etc).

**Textarea primitive** — `src/components/ui/Textarea/{index.tsx, Textarea.css.ts, Textarea.test.tsx}`. Multi-line text input with the same intent (default / danger) × size (sm / md / lg) variants as `Input`. `invalid` flips intent to `danger` and sets `aria-invalid`. Vertical resize on; horizontal locked.

**Vitest** — `src/components/form/Form.test.tsx` covers (1) zod schema → render → submit valid round-trip, (2) zod errors block submit and surface as inline messages. 79 tests across 26 files green.

**Mockup** — `src/pages/_dev/primitives/index.tsx` "24 · form" section (`<FormSystemSection>`) demonstrates Input / Textarea / Switch fields wired through `<Form>` / `<FormField>` / `<FormSection>` against a zod schema; submit button reads `isSubmitting` via `<form.Subscribe>`; reset button calls `form.reset()`.

**What's next (P3 follow-ups)**

- ConfigForm DSL renderer + `descriptorToSchema` — depends on porting real `/setting` descriptors. Tracked in spec 11 settings batch.
- `useBlocker(isDirty)` navigation guard — implement when first dirty-form view lands (`/posts/edit`, `/notes/edit`, etc).
- `Combobox` / `DatePicker` — deferred to spec 03b.

---

## Open questions

- **JSON / Monaco field rendering inside ConfigForm.** Renderers exist but Monaco mount costs first-paint. Consider lazy-loading `MonacoRenderer` only when the descriptor contains `type: 'monaco'`. Track during P3 settings port.
- **DatePicker / TimePicker.** Deferred to 03b. ConfigForm `date` renderer renders a fallback `<Input type="date">` until 03b lands.
- **i18n.** Form labels and validation messages are Chinese-only (mirrors source). If i18n becomes a goal later, schemas need to thread message keys instead of literal strings.
- **Form-level optimistic updates.** Some `/setting` autosave flows want optimistic UX. Decide per-field; default to "save → invalidate → refetch."
