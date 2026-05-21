# 03 · UI Primitives

**Date**: 2026-05-06
**Owner spec**: [00-roadmap.md](./00-roadmap.md)
**Phase**: P0 (5 primitives) → P2 (full set)
**Depends on**: 02 (theme contract, recipe conventions)
**Feeds**: 07 (layouts), 08 (form system), 11 (views)

Defines the headless-primitive layer wrapping `@base-ui-components/react` (Base UI) with Linear-styled css.ts recipes. Establishes the wrapper API contract so every primitive composes the same way and feels like one library to consumers.

---

## Scope

- **In**: file structure, wrapper API contract, P0 batch (Button, Input, Card, Modal, Toast), P2 batch (~20 more), motion-default policy, a11y rules, the policy for primitives Base UI does not provide (Scrollbar, Skeleton, Empty, Ellipsis, Space).
- **Out**: form binding (→ 08), table (→ 12), command palette (→ 10), editor surfaces (→ 09).

---

## Decisions

- **Wrap, don't re-export.** Every primitive is a thin component in `src/components/ui/<Name>/index.tsx` that composes a Base UI primitive with css.ts recipes. We never re-export Base UI directly. Reasons: lockable styling contract, escape hatches for future swaps, single point for default props (size, intent), and a stable API even if Base UI renames.
- **`forwardRef` everywhere.** Required for menus / popovers / floating positioning to compose.
- **`asChild` pattern via Base UI's `render` prop** when composing — no custom Slot. Base UI's primitives accept `render={(props) => <SomeChild {...props} />}` for slot polymorphism; we surface that one-to-one.
- **Recipes own variants.** Components own props. The component maps prop → recipe variant; never inlines style.
- **Motion is opt-in.** Primitives ship with sensible enter/exit animations via `motion` for overlays (Modal, Drawer, Tooltip, Popover, Toast). Buttons / inputs / cards animate on hover/focus via CSS transitions only.
- **One props philosophy: `intent | size | tone`.** Intent describes *purpose* (primary, secondary, danger). Size scales padding / type. Tone is rare — reserved for cases where a primitive needs a chromatic accent (e.g. Tag).
- **Class-merge via a tiny `cx` helper** in `src/utils/cx.ts`. No `clsx` dependency unless conditional logic explodes.
- **Scrolling — always through `<Scroll>`.** Any region that the user can scroll (modal body, dropdown popups, list panes, sidebar nav, page content, drawers, custom virtualized lists, and so on) MUST route through the `Scroll` primitive. Raw `overflow: auto` / `overflow: scroll` is banned in component and layout CSS — including `Modal.Body`, `Select.Popup`, `CommandPalette` results, `FullLayout.Body`, `TwoColLayout` panes, and `AppShell` sidebar nav, all of which were converted on 2026-05-10. **Pattern**: the parent owns sizing (`flex: 1; min-height: 0` or fixed height) and uses `display: flex` so the `<Scroll>` child can fill it; `<Scroll>` wraps a single inner element that holds the actual content + padding. Exception: the page-level `<html>` / `<body>` natural scroll is fine — Scroll is for in-app containers.

---

## File structure

```
src/components/ui/
├── Button/
│   ├── index.tsx              # exports Button + types
│   ├── Button.css.ts          # buttonRecipe
│   └── Button.test.tsx        # smoke + a11y
├── Input/
│   ├── index.tsx
│   ├── Input.css.ts
│   └── Input.test.tsx
├── Card/
│   ├── index.tsx
│   ├── Card.css.ts
│   └── Card.test.tsx
├── Modal/
│   ├── index.tsx              # Root, Trigger, Portal, Backdrop, Content, Close, Title, Description
│   ├── Modal.css.ts
│   └── Modal.test.tsx
├── Toast/
│   └── index.tsx              # re-exports `sonner` + a Toaster preset matching tokens
└── ...
```

Conventions:

- `index.tsx` exports the primitive plus its prop types (`ButtonProps`, `ModalRootProps`, etc.).
- A dedicated `<Name>.css.ts` colocated with the component owns the recipe(s).
- Tests are colocated; minimum: render, default props, a11y role assertion, one variant.
- A barrel `src/components/ui/index.ts` re-exports the curated public surface.

---

## Wrapper API contract

```ts
// pseudo-shape every primitive follows
type SizeProp = 'sm' | 'md' | 'lg'

interface PrimitiveProps {
  size?: SizeProp
  intent?: string
  tone?: string                  // optional, only when chromatic
  asChild?: never                // we use Base UI's `render` prop instead
  className?: string
  children?: React.ReactNode
}
```

Derived rules:

1. **`size` defaults to `'md'`.** Components without natural size variation omit the prop entirely.
2. **`intent` defaults vary per component.** Documented inline.
3. **`className` is appended after recipe classes**, allowing one-off escape hatches without breaking variant predictability.
4. **No `style` prop forwarding for primitives** — except for layout primitives where inline style is genuinely useful (positioning, dynamic z-index). Override styling goes through `className` + css.ts.
5. **Polymorphic primitives use Base UI's `render`.** Example: `<Button render={<Link to="/foo" />}>` swaps the underlying element to a router Link without losing styles or a11y.

---

## P0 batch — five primitives

These ship in P0 so the vertical slice in P1 can render `/login` and `/dashboard`.

### Button

```tsx
// src/components/ui/Button/index.tsx
import { forwardRef } from 'react'
import * as React from 'react'
import { buttonRecipe, type ButtonVariants } from './Button.css'
import { cx } from '~/utils/cx'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ intent = 'secondary', size = 'md', loading, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      className={cx(buttonRecipe({ intent, size, state: disabled || loading ? 'disabled' : undefined }), className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  )
)

Button.displayName = 'Button'
```

- Recipe variants: `intent` ∈ {primary, secondary, tertiary, inverse, danger}; `size` ∈ {sm, md, lg}.
- Loading state shows a `<Spinner size="sm" />` (Spinner is also a primitive — defined in P2 batch but a simple inline SVG for P0).
- Hover, active, focus-visible all live in the recipe; no inline pseudo-class JS.
- a11y: native `<button>` semantics. `aria-busy={loading}` automatic.

### Input

- Wraps `<input>` directly (Base UI does not provide a TextField primitive — the headless approach is to wire your own).
- Variants: `size` ∈ {sm, md, lg}; `intent` ∈ {default, danger} for invalid state.
- States: `disabled`, `readonly`, `invalid`.
- Slot for prefix / suffix icons via `<InputRoot>` + `<InputField>` decomposition (used by 08-form-system).
- a11y: `aria-invalid`, `aria-describedby` for error messages.

### Card

- Pure layout primitive. Recipe variants: `elevation` ∈ {flat, raised, raisedStrong, popover} mapping to tokens from spec 02.
- `padding` prop ∈ {sm, md, lg, none} maps to spacing tokens.
- `radius` ∈ {md, lg, xl}.
- Sub-components: `<Card.Header>`, `<Card.Body>`, `<Card.Footer>` — each is just a styled `<div>`. They exist for spacing consistency, not interaction.

### Modal

Wraps `@base-ui-components/react/dialog`.

```tsx
// public surface
<Modal.Root open={open} onOpenChange={setOpen}>
  <Modal.Trigger render={<Button>Open</Button>} />
  <Modal.Portal>
    <Modal.Backdrop />
    <Modal.Content size="md">
      <Modal.Header>
        <Modal.Title>Title</Modal.Title>
        <Modal.Close render={<Button intent="tertiary" size="sm" />} />
      </Modal.Header>
      <Modal.Body>...</Modal.Body>
      <Modal.Footer>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button intent="primary">Save</Button>
      </Modal.Footer>
    </Modal.Content>
  </Modal.Portal>
</Modal.Root>
```

- `Modal.Content` accepts `size` ∈ {sm, md, lg, xl, full} — maps to width tokens.
- Animation: `motion.div` wraps `<Modal.Content>`. Enter: opacity + scale 0.96 → 1 over `motion.duration.enter`. Exit: reverse over `motion.duration.exit`. Backdrop fades.
- Escape closes; click-outside closes (overridable).
- Focus trap: handled by Base UI; first focusable inside `Modal.Content` receives focus on open.
- Body scroll lock: handled by Base UI.

### Toast

```tsx
// src/components/ui/Toast/index.tsx
import { Toaster, toast } from 'sonner'

export const ToastViewport = () => (
  <Toaster
    position="top-center"
    theme="dark"
    toastOptions={{
      style: { /* token-driven */ },
      className: toastRecipe(),
    }}
  />
)

export { toast }
```

- One `<ToastViewport />` mounts at app root in `App.tsx`.
- The token-styled `toastRecipe` matches Card raised + hairline.
- Variants on call site: `toast.success(...)`, `toast.error(...)`, `toast.warning(...)`. The styling for each maps to admin semantic colors (success, danger, warning).
- a11y: sonner ships proper aria-live regions; we don't reimplement.

---

## P2 batch — full primitive set

Ships in P2 (after P1 calibrates tokens). Rough order of dependence so blockers come first:

| Primitive | Base UI source | Status | Notes |
|---|---|---|---|
| **Drawer** | `dialog` (positioned) | shipped 2026-05-10 | Slide-in panel; reuses Modal animation kit. Variants: `placement` ∈ {right, left, bottom, top}. |
| **Tooltip** | `tooltip` | shipped 2026-05-10 (P2 batch A) | Default delay 300 ms set on `<Tooltip.Provider>` mounted in `App.tsx`. Sugar `<Tooltip content … />` wraps Root + Trigger + Portal + Positioner + Popup; namespace parts also exposed. |
| **Popover** | `popover` | shipped 2026-05-10 (P2 batch A) | Namespace API (Root/Trigger/Portal/Positioner/Popup/Close/Title/Description/Backdrop). Popup variants: `padding` ∈ {none,sm,md,lg}, `width` ∈ {auto,sm,md,lg}. |
| **Tabs** | `tabs` | shipped 2026-05-10 (P2 batch A) | Variants: `variant` ∈ {underline, pill} threaded through React context so List/Tab/Indicator stay in sync. Indicator slides via Base UI's `--active-tab-*` CSS vars. |
| **Select** | `select` | shipped 2026-05-10 (P2 batch A) | Namespace API (Root/Trigger/Value/Icon/Portal/Positioner/Popup/Item). Trigger size ∈ {sm,md,lg}. Item ships an inline `ItemIndicator` ✓ check. Multi-select / Combobox deferred. |
| **Switch** | `switch` | shipped 2026-05-10 (P2 batch A) | Single `<Switch>` component (size ∈ {sm,md,lg}) — Base UI emits the hidden input internally. |
| **Checkbox** | `checkbox` | shipped 2026-05-10 (P2 batch A) | Tri-state via `indeterminate`; renders a check or minus inside Indicator depending on state. Sizes {sm,md,lg}. |
| **Radio** | `radio` + `radio-group` | shipped 2026-05-10 (P2 batch B) | `Radio.Group` (orientation × size context) + `Radio.Root` + `Radio.Item` (label-wrapped sugar). Indicator scales via `data-starting-style` / `data-ending-style`. |
| **Textarea** | own | shipped 2026-05-10 (form-system needs) | Multi-line text input mirroring `Input`'s intent × size variants. `invalid` flips intent to `danger` and sets `aria-invalid`. Vertical resize only. |
| **Tag** | own | shipped 2026-05-10 (P2 batch B) | Variants: `tone` ∈ {neutral, primary, success, danger, warning, info}; `size` ∈ {sm, md}; `closable` exposes a sub-button with its own focus ring. |
| **Avatar** | `avatar` | shipped 2026-05-10 (P2 batch B) | Wraps Base UI avatar. Variants: `size` ∈ {xs, sm, md, lg, xl}; `shape` ∈ {circle, rounded}. Image → initials → `fallback` slot. |
| **Badge** | own | shipped 2026-05-10 (P2 batch B) | Numeric / dot. Anchors top-right when wrapping a child; renders standalone otherwise. `count` formats `${max}+` when over `max`. `showZero={false}` hides numeric zero. |
| **Pagination** | own | shipped 2026-05-10 (P2 batch B) | Page list + page-size Select. Caller-controlled (`page`, `pageSize`). Sibling pages collapse to ellipsis when range > 2·siblingCount + 5. Composes our `<Select>` for the size picker. |
| **Skeleton** | own | shipped 2026-05-10 (P2 batch B) | Pulse + shimmer via two CSS keyframes. Shapes: text / rect / circle. `<SkeletonGroup lines>` renders a stacked text block with the last line truncated to 60 %. |
| **Empty** | own | shipped 2026-05-10 (P2 batch B) | Composition: rounded icon badge + title + description + action slot. Default icon Lucide `<InboxIcon>`. |
| **Spinner** | own | shipped 2026-05-10 (P2 batch B) | Promoted from inline `Button/Spinner` to top-level primitive. Sizes {xs, sm, md, lg, xl}. `aria-label` upgrades the SVG to `role=status`; otherwise stays decorative. Button now imports the shared spinner. |
| **Progress** | `progress` | shipped 2026-05-10 (P2 batch B) | Wraps Base UI progress; size variant on track, tone variant on indicator, optional label row using `<Progress.Label>` + `<Progress.Value>`. Indeterminate state animates via shimmer keyframe. |
| **Ellipsis** | own | shipped 2026-05-10 (P2 batch B) | Pure CSS `text-overflow: ellipsis`. ResizeObserver tracks overflow; when overflowing, wraps children in `<Tooltip>`. `noTooltip` opts out. |
| **Scroll** | `scroll-area` | shipped 2026-05-10 (P2 batch B) | Wraps Base UI scroll-area with token-styled scrollbars that fade out when idle. `orientation` ∈ {vertical, horizontal, both}; both renders a corner. |
| **Space** | own | shipped 2026-05-10 (P2 batch B) | Layout-only flex utility. Variants: direction × gap × align × justify × wrap, all token-driven. |

### Primitives Base UI does not provide

These are pure markup + css.ts:

- **Skeleton** — animated background gradient via `motion.div`'s `animate` cycling opacity.
- **Empty** — composition of `<Card>` + icon + text. No interactive logic.
- **Ellipsis** — `useEffect` measures `scrollWidth > offsetWidth` and conditionally wraps in Tooltip.
- **Scroll** — wrapper `<div>` with overflow + WebKit scrollbar styles. Optional `simplebar-react` only if the cross-browser custom scrollbar story matters; default skip and use native styled scrollbar.
- **Space** — `<div>` with `display: flex` + `gap: theme.spacing[size]`.
- **Spinner** — inline SVG with `motion` rotation.

### Lookup-only primitives

These exist as exports from third-party libs without admin wrappers (decision made in 00):

- `lucide-react` icons — imported per-icon, no wrapper.
- `sonner` `toast()` function — used directly through the Toast index re-export.
- `kbar` — full app integration in spec 10, not a primitive.

---

## Motion defaults

| Primitive | Enter | Exit | Driver |
|---|---|---|---|
| Modal.Content | opacity 0→1, scale 0.96→1, `duration.enter` | reverse, `duration.exit` | motion |
| Modal.Backdrop | opacity 0→1, `duration.enter` | reverse, `duration.exit` | motion |
| Drawer | translate from edge 100%→0, `duration.enter` | reverse, `duration.exit` | motion |
| Tooltip | opacity 0→1, scale 0.95→1, delay 200ms | opacity → 0, instant | CSS transition |
| Popover | opacity 0→1, translate origin 4px→0, `duration.fast` | reverse, `duration.fast` | motion |
| Toast | sonner default | sonner default | sonner |
| Tabs indicator | translate via `motion.layout` | — | motion |
| Skeleton | continuous opacity 0.6 ↔ 1 | — | motion |
| Spinner | continuous rotate 0→360 | — | motion |
| Hover transitions | background-color, border-color, opacity over `duration.fast` | reverse | CSS transition |

`motion`'s `AnimatePresence` wraps overlay primitives. CSS transitions handle micro-interactions (hover, focus); motion handles entrances and gestures.

---

## a11y baseline

Mandatory across primitives:

- Focus-visible outlines from spec 02's `elevation.focusRing`. No `outline: none` without a visible replacement.
- Keyboard nav: Tab, Shift+Tab, Esc, Enter, Space match WAI-ARIA Authoring Practices for the role.
- All overlays trap focus (Modal, Drawer); transient overlays (Tooltip, Popover) do not.
- All form primitives accept `aria-label` or `aria-labelledby`. The form system in 08 wires labels automatically.
- Color contrast: ink on canvas / surface meets WCAG AA (≥ 4.5:1 for body, ≥ 3:1 for ≥ 18 px). Verify against the Linear palette during 02 calibration.
- Reduced-motion: `motion` honors `prefers-reduced-motion`; primitives explicitly opt into the system value via `useReducedMotion()`.

---

## Naming and barrel exports

```ts
// src/components/ui/index.ts
export { Button, type ButtonProps } from './Button'
export { Input, type InputProps } from './Input'
export { Card } from './Card'
export { Modal } from './Modal'
export { ToastViewport, toast } from './Toast'
// ... P2 additions
```

Consumers import via the barrel: `import { Button, Modal } from '~/components/ui'`.

---

## Acceptance for spec 03

### P0 acceptance

1. `Button` ships with all five intents (primary, secondary, tertiary, inverse, danger), three sizes, loading state.
2. `Input` ships with default and danger intents, three sizes, prefix/suffix slots.
3. `Card` ships with four elevations and four padding sizes.
4. `Modal` ships with all sub-components and motion defaults.
5. `ToastViewport` mounted in `App.tsx` shows the four semantic toasts via `toast.success/error/warning/info`.
6. All P0 primitives pass keyboard-only navigation smoke test (matrix below).
7. Each P0 primitive has at least one Vitest spec covering render + one variant.

#### P0 keyboard a11y smoke matrix

The matrix below records the expected keyboard contract per primitive. Each row is either covered automatically by Vitest (cite the spec) or signed off manually in a real browser (cite the date + signer). Sign-offs land in [STATUS.md](./STATUS.md) changelog when the row flips to ✅.

| Primitive | Expectation | Coverage |
|---|---|---|
| Button | Focusable via Tab, focus-visible ring shows, Enter/Space activates `onClick`, `disabled` removes from tab order | `Button.test.tsx` covers click + disabled blocking; native `<button>` semantics provide Enter/Space; focus-ring verified manually |
| Input | Focusable via Tab, typing fires `onChange`, `disabled` skips tab order, `aria-invalid` set when `invalid` | `Input.test.tsx` covers typing + invalid + disabled |
| Card | Non-interactive surface; if a child is interactive, it must remain focusable | Manual smoke — non-interactive node, nothing automated needed |
| Modal | Trigger Enter opens, Escape closes, focus traps inside Content while open, focus returns to Trigger on close | `Modal.test.tsx` covers open/close round-trip via Trigger/Close; Escape + focus trap rely on Base UI Dialog and are signed off manually |
| Toast | Toaster mounts, screen-reader announces via `role="status"` (sonner default), Escape dismisses focused toast | `Toast.test.tsx` covers viewport mount + four semantic variants; SR + Escape rely on sonner defaults and are signed off manually |

### P2 acceptance

1. All P2 primitives listed above ship with documented variants.
2. Drawer reuses Modal animation primitives (no separate drift).
3. Tabs, Select, Switch, Checkbox, Radio integrate cleanly with `@tanstack/react-form` (verified by spec 08).
4. Skeleton, Empty, Ellipsis, Scroll, Space exist and are used in at least one P3 view to validate the API.
5. The barrel `~/components/ui` exports the full primitive set and is documented in `src/components/ui/README.md`.

#### P2 batch A · 2026-05-10

Form-adjacent + overlay primitives shipped together so spec 08 (forms) is unblocked.

- **Tooltip** — `src/components/ui/Tooltip/{index.tsx, Tooltip.css.ts, Tooltip.test.tsx}`. Sugar `<Tooltip content side …>` for the common case; namespace parts (`Tooltip.Root`, `Trigger`, `Portal`, `Positioner`, `Popup`, `Provider`) for custom assembly. `<Tooltip.Provider delay={300} closeDelay={100}>` mounted at `App.tsx` so all tooltips inherit the global delay; tone variant ∈ {default, inverse}.
- **Popover** — `src/components/ui/Popover/{index.tsx, Popover.css.ts, Popover.test.tsx}`. Namespace-only API mirroring Modal's shape. `padding` × `width` variants on the popup; backdrop ships an opt-in `<Popover.Backdrop />`.
- **Switch** — `src/components/ui/Switch/{index.tsx, Switch.css.ts, Switch.test.tsx}`. One component; `size` variant scales the rail and slides the thumb proportionally via per-size `translateX`.
- **Checkbox** — `src/components/ui/Checkbox/{index.tsx, Checkbox.css.ts, Checkbox.test.tsx}`. Indicator renders Lucide check or minus depending on Base UI's `state.checked / state.indeterminate`. Stroke width 3 to read at the 14 px primary size.
- **Tabs** — `src/components/ui/Tabs/{index.tsx, Tabs.css.ts, Tabs.test.tsx}`. `variant` ∈ {underline, pill} threaded via local React context so consumers set it once on `<Tabs.Root>`. Indicator absolutely-positioned via CSS vars Base UI sets.
- **Select** — `src/components/ui/Select/{index.tsx, Select.css.ts, Select.test.tsx}`. Trigger size ∈ {sm, md, lg}. Items ship an inline ItemIndicator check. `Select.Value` accepts a render-fn child for placeholder fallback (Base UI doesn't expose a `placeholder` prop). Multi-select / search-Combobox deferred to a follow-up.
- **Mockup** — `src/pages/_dev/primitives/index.tsx` extended with six new sections (06–11) and four new style helpers (`inlineRow`, `fieldLabel`, `popoverList`, `popoverItem`, `tabsBlock`, `tabPanelBody`) in `page.css.ts`.
- **Tests** — vitest suite goes from 16 → 46 cases (15 added across the six primitives). Pointer-driven Select selection skipped under jsdom; assertion drops to "popup mounts options on click" — full selection is covered by the mockup page in dev.
- **Provider wiring** — `App.tsx` now wraps `<AppRoutes />` and `<ModalHost />` with `<Tooltip.Provider>`.

#### P2 batch B · 2026-05-10

Display + utility primitives shipped together so spec 11 views and spec 12 table can compose freely.

- **Spinner** — `src/components/ui/Spinner/{index.tsx, Spinner.css.ts, Spinner.test.tsx}`. **Promoted from `Button/Spinner` to top-level primitive.** `Button` now imports `../Spinner`; old paths in `RouteFallback.tsx` and `pages/setup/index.tsx` updated.
- **Space** — `src/components/ui/Space/{index.tsx, Space.css.ts}`. Layout-only flex utility — direction × gap × align × justify × wrap.
- **Tag** — `src/components/ui/Tag/{index.tsx, Tag.css.ts, Tag.test.tsx}`. Six tones using `rgba` backgrounds + matching borders that pass against the surface ladder. Closable variant inserts an `XIcon` button with its own a11y label.
- **Badge** — `src/components/ui/Badge/{index.tsx, Badge.css.ts, Badge.test.tsx}`. Anchors top-right of a child slot or renders standalone. Adds a 2 px canvas-colored ring so it reads above any surface.
- **Avatar** — `src/components/ui/Avatar/{index.tsx, Avatar.css.ts, Avatar.test.tsx}`. Wraps Base UI's avatar; default-export `Avatar` is a sugar that takes `src` / `initials` / `fallback`. Namespace parts (`Avatar.Root`, `Image`, `Fallback`) attached via `Object.assign`.
- **Progress** — `src/components/ui/Progress/{index.tsx, Progress.css.ts, Progress.test.tsx}`. Wraps Base UI progress with size × tone × label row. Indeterminate animation forces the indicator width to 40 % and translates -100% → 200 % on a 1.4 s loop.
- **Radio** — `src/components/ui/Radio/{index.tsx, Radio.css.ts, Radio.test.tsx}`. `Radio.Group` provides shared state and threads `size` through context; `Radio.Item` renders the root + label so the click target extends across the text.
- **Skeleton** — `src/components/ui/Skeleton/{index.tsx, Skeleton.css.ts, Skeleton.test.tsx}`. CSS-only animation (no `motion` runtime). `<SkeletonGroup lines>` renders a vertical stack with the last line truncated to 60 % so the block reads like real prose.
- **Empty** — `src/components/ui/Empty/{index.tsx, Empty.css.ts, Empty.test.tsx}`. Composition only — no interaction. Default `<InboxIcon>` for the icon badge, default title `Nothing here yet`. `EmptyProps` omits HTMLAttributes' `title` so we can take `ReactNode`.
- **Ellipsis** — `src/components/ui/Ellipsis/{index.tsx, Ellipsis.css.ts, Ellipsis.test.tsx}`. ResizeObserver detects `scrollWidth > offsetWidth + 1`, then wraps in `<Tooltip>`. `tooltip` prop overrides; `noTooltip` opts out.
- **Scroll** — `src/components/ui/Scroll/{index.tsx, Scroll.css.ts, Scroll.test.tsx}`. Wraps Base UI's `scroll-area` (root → viewport → scrollbar → thumb), sets opacity 0 by default and 1 on `data-hovering` / `data-scrolling`.
- **Pagination** — `src/components/ui/Pagination/{index.tsx, Pagination.css.ts, Pagination.test.tsx}`. Owns no state; caller drives `page` / `pageSize`. Sibling computation collapses to ellipsis when total pages exceed `2·siblingCount + 5`. Page-size selector is opt-in (`pageSizeOptions` + `onPageSizeChange`).
- **Mockup** — `src/pages/_dev/primitives/index.tsx` extended with twelve new sections (12–23) and four new style helpers (`stack`, `scrollFrame`, `scrollItem`, `ellipsisFrame`).
- **Tests** — vitest goes 46 → 74 cases (28 added). `Pagination` covers next/prev, disabled boundaries, ellipsis production. Pointer-driven Radio selection uses `fireEvent.click`.
- **Spec 10 / `useG2Chart`** — superseded by recharts (see spec 10 changelog).

---

## Open questions

- **Drawer vs sheet naming.** Source repo uses Drawer; Base UI uses dialog with positioning. Stick with Drawer. Decided.
- **DatePicker / TimePicker.** Not in P2 batch. Defer until first view that needs it (notes/edit metadata drawer in P4); decide between `react-day-picker` and a hand-rolled Base UI `popover` + custom calendar. Tracked as 03b.
- **Combobox vs Select-with-search.** If a P3 view needs search inside a select, build `Combobox` as a P2 follow-up. Default: ship Select first, observe.
- **Color picker.** One use site. Defer.
