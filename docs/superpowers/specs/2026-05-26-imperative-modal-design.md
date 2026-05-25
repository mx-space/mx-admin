# Imperative Modal System — Design Spec

- **Date:** 2026-05-26
- **Scope:** `apps/admin/src/ui/modal-imperative/` + migration of `DraftRecoveryDialog`
- **Status:** Draft for review

## Motivation

The admin app currently exposes modals as declarative components: the parent owns an `open` state and renders `<Modal open=... onClose=...>` somewhere in its JSX subtree. This forces every callsite to:

- Allocate state (`recoveryDraft`, `draftListOpen`, etc.).
- Thread close handlers through callback props.
- Conditionally render the modal inside the form, coupling lifecycle to the parent.

For one-shot interactions ("show a recovery dialog and wait for the user to choose") this is verbose and noisy. We want an **imperative API** that can be invoked from anywhere — event handlers, async functions, query callbacks, store actions — without owning UI state.

The first migration target is `DraftRecoveryDialog` at `apps/admin/src/views/write-page.tsx:1155`.

## Goals

1. A single function `present(Component, props, options?)` that mounts a modal and returns a handle.
2. Handles expose `close(value?)`, `dismiss()`, `update(partial)`, and are PromiseLike (`await handle` resolves to the closed value).
3. A `useModal()` hook lets the modal body close itself without prop drilling.
4. Multiple modals stack correctly: z-index, focus trap, exit animation all behave.
5. Reuse the existing `Modal` primitive (`src/ui/modal.tsx`) and `useFloatingZ` layering — no rewrite of the visual shell.
6. Migrate `DraftRecoveryDialog` to use the new API as proof of concept.

## Non-Goals

- Replacing every existing `<Modal>` callsite. Only `DraftRecoveryDialog` migrates in this iteration; remaining modals (`DraftListDialog`, location search, markdown parser, etc.) stay declarative and may be migrated later.
- Building drawer, popover, or toast managers. This spec is dialog-only. The existing `Drawer` and Sonner remain.
- Supporting Suspense boundaries inside modal bodies (the underlying `Modal` already handles `keepMounted` via base-ui).
- Persisting modal stack across full page reloads.

## Architecture

```
apps/admin/src/ui/modal-imperative/
  store.ts        # Zustand-style stack store with subscribe/snapshot
  present.ts      # present(): build instance, return handle
  context.tsx     # ModalInstanceContext + useModal() hook
  root.tsx        # <ModalRoot/> subscribes store and renders stack
  types.ts        # ModalHandle, ModalInstance, PresentOptions
  index.ts        # public API barrel
```

The existing `src/ui/modal.tsx` (`Modal`, `ModalHeader`, `ModalTitle`, etc.) is untouched. The new system wraps user components with `<Modal>` internally — it is a layer above, not a replacement.

### Store

Internal state held in a module-level store (no React context required for `present`):

```ts
interface ModalInstance<P = any, T = unknown> {
  id: string
  Component: ComponentType<P>
  props: P
  options: ResolvedPresentOptions
  deferred: Deferred<T | undefined>
  status: 'open' | 'closing'
}

interface ModalStore {
  stack: ModalInstance[]
  push(inst: ModalInstance): void
  update(id: string, patch: Partial<ModalInstance>): void
  remove(id: string): void
  subscribe(listener: () => void): () => void
  getSnapshot(): ModalInstance[]
}
```

Implementation uses `useSyncExternalStore` for React subscription. No external deps needed; a hand-rolled store keeps the surface tiny.

### Public API

```ts
// types.ts
export interface ModalHandle<T = unknown> extends PromiseLike<T | undefined> {
  id: string
  close: (value?: T) => void
  dismiss: () => void
  update: <P>(propsPatch: Partial<P>) => void
}

export interface PresentOptions {
  modalProps?: Partial<Omit<ModalProps, 'open' | 'onClose' | 'children'>>
  dismissable?: boolean // default true
}

// present.ts
export function present<P extends object, T = unknown>(
  Component: ComponentType<P>,
  props: P,
  options?: PresentOptions,
): ModalHandle<T>

// context.tsx
export function useModal<T = unknown>(): {
  id: string
  close: (value?: T) => void
  dismiss: () => void
}

// root.tsx
export function ModalRoot(): JSX.Element
```

`index.ts` re-exports `present`, `useModal`, and `ModalRoot`.

### Handle Semantics

- `close(value)` resolves the promise with `value`, sets `status = 'closing'`, and schedules removal once the Modal's `AnimatePresence` exit completes (the existing Modal already wires `onExitComplete` → `actionsRef.unmount`; we add a removal callback at the store level).
- `dismiss()` is `close(undefined)`. Used for backdrop click, ESC, and the X button.
- `update(propsPatch)` shallow-merges and triggers re-render. No-op after status transitions to `closing`.
- Multiple `close` calls are idempotent — only the first resolves.
- The handle is `PromiseLike`: `handle.then(onFulfilled)` and `await handle` work without exposing the underlying promise object.

### Render Flow

```tsx
function ModalRoot() {
  const stack = useSyncExternalStore(
    modalStore.subscribe,
    modalStore.getSnapshot,
    modalStore.getSnapshot,
  )

  return (
    <>
      {stack.map((inst, index) => (
        <PortalLayerScope key={inst.id} depth={index}>
          <ModalInstanceContext.Provider value={makeHandle(inst)}>
            <Modal
              open={inst.status === 'open'}
              onClose={() => {
                if (inst.options.dismissable) {
                  inst.deferred.resolve(undefined)
                  modalStore.update(inst.id, { status: 'closing' })
                }
              }}
              {...inst.options.modalProps}
            >
              <inst.Component {...inst.props} />
            </Modal>
          </ModalInstanceContext.Provider>
        </PortalLayerScope>
      ))}
    </>
  )
}
```

The Modal's internal `AnimatePresence` already plays an exit animation when `open` flips to `false`. To know when the exit completes (so we can remove the instance from the store), `Modal` is extended with one new optional prop:

```ts
interface ModalProps {
  // ...existing fields
  onExitComplete?: () => void
}
```

Inside `Modal`, the existing `<AnimatePresence onExitComplete={...}>` callback is extended to call `props.onExitComplete?.()` after `actionsRef.current?.unmount()`. This is a minimal, additive change to `src/ui/modal.tsx` — no behavior change for existing callsites. `ModalRoot` wires `onExitComplete={() => modalStore.remove(inst.id)}`.

### z-index Layering

`Modal` already uses `useFloatingZ('dialog')`, which reads the parent `PortalLayerContext` depth and adds 1. The `ModalRoot` wraps each instance in `<PortalLayerScope depth={index}>`, so instance `n` ends up with `depth = n + 1`. Each modal's portal sits above the previous, including any popovers opened from inside, which read this depth via `PortalLayerScope` already wired in `Modal`'s `popup` child.

Existing declarative `<Modal>` callsites continue to use depth 1, so they coexist with imperative modals (the topmost wins because it mounts later).

### Provider Mount Point

Mount once, at the top of the app tree, **outside** the router so route navigation does not unmount in-flight modals:

```tsx
// main.tsx (or wherever the root tree is composed)
<QueryClientProvider>
  <RouterProvider router={router} />
  <ModalRoot />
  <Toaster />
</QueryClientProvider>
```

If the user navigates while a modal is open, the modal stays mounted. The component is responsible for closing itself in response to relevant state changes if needed.

## Data Flow

```
caller: present(Comp, props, opts)
   │
   ├─ build ModalInstance { id, Component, props, options, deferred, status:'open' }
   ├─ modalStore.push(instance)
   └─ return ModalHandle (close / dismiss / update / then)

ModalRoot re-renders via useSyncExternalStore
   │
   └─ for each inst: render <Modal open={status==='open'}> <Component .../> </Modal>

caller (or inner useModal): handle.close(value)
   │
   ├─ deferred.resolve(value)  // idempotent
   ├─ modalStore.update(id, { status: 'closing' })
   │     └─ Modal sees open=false → AnimatePresence plays exit
   └─ onExitComplete → modalStore.remove(id)
```

## Error Handling

- `handle` never rejects. Resolution value is `T | undefined`.
- Business errors raised inside the component are the component's concern (e.g., toast on validation failure). They do not affect modal lifecycle.
- If `ModalRoot` unmounts (app teardown), the store flushes remaining instances and resolves their deferreds with `undefined`.
- Re-entrant `present` calls inside a modal body work — the new instance pushes on top of the stack.
- `close` after `closing` is a no-op.
- `update` after `closing` is a no-op.

## Dismissable Behavior

`dismissable: true` (default):
- Backdrop click → `dismiss()`
- ESC key → `dismiss()`
- Modal `X` button (when consumer uses `ModalHeader`) → `useModal().dismiss()`

`dismissable: false`:
- Backdrop and ESC do nothing (Modal `onClose` is wired but checks the flag).
- The component must offer an explicit affordance and call `close`/`dismiss` itself.

## Migration: DraftRecoveryDialog

**Before** (`write-page.tsx:1155`):

```tsx
{recoveryDraft && publishedContent ? (
  <DraftRecoveryDialog
    draft={recoveryDraft}
    onClose={() => setRecoveryDraft(null)}
    onRecover={(draft) => {
      applyDraft(draft)
      setRecoveryDraft(null)
    }}
    onUsePublished={() => {
      draftDirtyRef.current = false
      lastSavedDraftFingerprintRef.current = latestDraftFingerprintRef.current
      setLastSavedFingerprint(latestDraftFingerprintRef.current)
      setRecoveryDraft(null)
    }}
    publishedContent={publishedContent}
  />
) : null}
```

**After**:

- Remove the `recoveryDraft` state and JSX block above.
- At the site that previously did `setRecoveryDraft(d)`, call `present` instead:

  ```tsx
  const handle = present(DraftRecoveryDialog, {
    draft: d,
    publishedContent,
    onRecover: (draft) => {
      applyDraft(draft)
      handle.close()
    },
    onUsePublished: () => {
      draftDirtyRef.current = false
      lastSavedDraftFingerprintRef.current = latestDraftFingerprintRef.current
      setLastSavedFingerprint(latestDraftFingerprintRef.current)
      handle.close()
    },
  })
  ```

- In `DraftRecoveryDialog` itself (`write-page.tsx:1439`):
  - Drop the `onClose` prop.
  - Remove the outer `<Modal open ...>` wrapper. Render only the header and body. `ModalRoot` provides the Modal shell.
  - The cancel/close affordance in the footer (or `ModalHeader`'s X) calls `useModal().dismiss()`.

The component now reads as a self-contained body and is reusable in any context — invoke it imperatively from anywhere in the codebase.

## Testing

**Unit (store + handle):**
- Pushing two instances yields two entries in `getSnapshot()` order.
- `handle.close(v)` resolves the promise to `v`; subsequent calls are no-ops.
- `handle.dismiss()` resolves to `undefined`.
- `handle.update(partial)` mutates `instance.props` and notifies subscribers.

**Integration (with React Testing Library):**
- After `present(Foo, {})`, `<Foo>` is in the DOM inside a `Modal`.
- Calling `handle.close()` removes `<Foo>` after exit animation completes (use `findByText` with timeout to allow the animation).
- Two `present` calls produce two stacked modals; the second is on top (verified by computed z-index or DOM order).
- `useModal().close('answer')` inside the body resolves the outer `await present(...)` to `'answer'`.

**Manual regression on the migrated dialog:**
- Save a draft, refresh, observe recovery prompt fires.
- Pick "use current draft" → editor restores draft.
- Pick "use published" → editor reverts.
- Click backdrop → dismisses with no state change.

## Open Questions / Future Work

- Should `present` be callable before `ModalRoot` mounts? Today, yes — the store accepts pushes, and `ModalRoot` flushes them once it mounts. Document this so async-boot callers aren't surprised.
- A `confirm(message, options?)` helper that wraps a built-in confirmation component and returns `Promise<boolean>` would simplify the most common case. Not in this iteration.
- Stack-position control (e.g., `position: 'topmost'` for alerts) — defer until needed.

## File-by-File Changes

| File | Change |
|------|--------|
| `apps/admin/src/ui/modal-imperative/store.ts` | NEW — module-scoped store, subscribe API |
| `apps/admin/src/ui/modal-imperative/present.ts` | NEW — `present()` entry, deferred + handle |
| `apps/admin/src/ui/modal-imperative/context.tsx` | NEW — instance context + `useModal()` |
| `apps/admin/src/ui/modal-imperative/root.tsx` | NEW — `<ModalRoot/>`, subscribes store, renders stack |
| `apps/admin/src/ui/modal-imperative/types.ts` | NEW — type defs |
| `apps/admin/src/ui/modal-imperative/index.ts` | NEW — barrel |
| `apps/admin/src/ui/modal.tsx` | EDIT — add optional `onExitComplete?: () => void` prop, additive |
| `apps/admin/src/main.tsx` (or root composition file) | EDIT — mount `<ModalRoot/>` next to `<Toaster/>` |
| `apps/admin/src/views/write-page.tsx` | EDIT — remove `recoveryDraft` state + JSX block; call `present` at trigger; strip `<Modal>` and `onClose` from `DraftRecoveryDialog` |
