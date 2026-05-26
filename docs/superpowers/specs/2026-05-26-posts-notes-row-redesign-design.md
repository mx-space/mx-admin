# /posts & /notes Row Redesign + Singleton ContextMenu

**Status**: Draft
**Date**: 2026-05-26
**Scope**: `apps/admin/src/features/{posts,notes}/**`, new `apps/admin/src/ui/overlay/context-menu/**`

## 1. Context & Problem

`/posts` and `/notes` today render long single-column lists. Each row is a single horizontal strip with a checkbox, leading icons, the title, a status badge, a metadata strip, and four action buttons (publish toggle, edit link, external link, delete). Two row-level inline editors live inside the metadata strip:

- `PostRow` exposes an inline category `SelectField`.
- `NoteRow` exposes inline `InlineTextEdit` widgets for mood and weather.

Pain points:

- **Visual noise.** Inline-edit controls + four action buttons on every row dilute the title and metadata. Scanning is slow.
- **No discoverable affordance for secondary operations.** Operations like pin, bookmark, copy link, copy id, copy slug, change category, change mood/weather have no consistent home — some are inline, some require navigating to the editor, some don't exist at all.
- **No right-click affordance.** Users expect a context menu on list items in a content admin (mirroring Finder/Notion/Linear). The project's component library has no `ContextMenu` primitive.

Goals:

- Keep the single-column list shape — no master-detail.
- Restructure each row to a clean two-line layout (title row + meta row) with no inline-edit controls.
- Add three persistent right-aligned action icons (light by default, darker on row hover) — no layout shift.
- Add a project-wide singleton imperative `ContextMenu` primitive and a `ContextMenuTrigger` wrapper so any row (or other surface) can opt in.

Non-goals:

- Changing the page-level toolbar (filter / sort / search / bulk-delete) or pagination behavior.
- Changing the editor pages (`/posts/edit`, `/notes/edit`).
- Replacing the underlying `PostsRouteViewContent` / `NotesRouteViewContent` data layer.
- Master-detail layout (explicitly rejected; admin-page-layout skill is overridden here by user direction).

## 2. Design Overview

```
┌────────────────────────────────────────────────────────────────────┐
│ ContentListHeader (unchanged)                                      │
├────────────────────────────────────────────────────────────────────┤
│ ContentListToolbar  (unchanged)                                    │
├────────────────────────────────────────────────────────────────────┤
│ ☐ 📌 Title text                       [已发布]      ✎  ↗  ⋯       │
│       category · tags · 👁 12 · ♡ 5                    2 days ago  │
├────────────────────────────────────────────────────────────────────┤
│ ☐    Title text                       [草稿]        ✎  ↗  ⋯       │
│       category · tags · 👁 0 · ♡ 0                     5 days ago  │
├────────────────────────────────────────────────────────────────────┤
│ Pagination (unchanged)                                             │
└────────────────────────────────────────────────────────────────────┘
```

Three sub-features:

1. **Row visual restructure** — title line + meta line, no inline edits.
2. **Persistent dimmed action icons + row context menu** — three icons on the title line that brighten on row hover. Right-click anywhere on the row opens a context menu. The clicked row gets an `active` background while the menu is open.
3. **`ContextMenu` primitive** — new `~/ui/overlay/context-menu` module with singleton store, host, `openContextMenu()` imperative entry, and `<ContextMenuTrigger>` render-prop wrapper.

## 3. Row Visual Spec (shared)

A new shared component `ContentEntryListItemV2` (or a refactor of `ContentEntryListItem`) renders two stacked lines inside an `<article>` element.

**Title row** (single line, `flex items-center gap-2`):

| Slot         | Source                                                              |
| ------------ | ------------------------------------------------------------------- |
| Checkbox     | `selected` + `onSelectedChange`                                     |
| `leading`    | Caller-provided icons (pin for posts; #nid + EyeOff + bookmark for notes) |
| Title `<Link>` | `title`, `titleTo` — navigates to edit page                       |
| `status`     | `ContentListStatusBadge`                                            |
| Action icons | Three icons in a fixed slot: `✎` (edit link), `↗` (external link), `⋯` (opens context menu) |

Action-icon slot is always rendered (no layout shift). Default color `text-neutral-300 dark:text-neutral-700`; on `article:hover` or `data-context-menu-active`, escalate to `text-neutral-600 dark:text-neutral-300`. Each icon button has its own `hover:bg-neutral-100 dark:hover:bg-neutral-800` so individual icon hover is still distinct.

**Meta row** (`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500`, padded left to align under the title):

- Posts: category-chip · tag list · 👁 readCount · ♡ likeCount · relative time
- Notes: #nid (mono) · slug (mono) · mood · weather · location (if any) · 👁 readCount · ♡ likeCount · relative time

The two existing inline editors are removed:

- `PostRow` — `SelectField` for category is removed; category becomes a plain text chip and is editable only via the context menu's "修改分类" submenu (or in the editor).
- `NoteRow` — `InlineTextEdit` for mood and weather is removed; both are editable only via the context menu (submenu input).

Row background:

- Default: transparent.
- `hover`: `bg-neutral-50 dark:bg-neutral-900/50`.
- `data-context-menu-active`: `bg-neutral-100 dark:bg-neutral-800`.

## 4. `~/ui/overlay/context-menu` — Singleton Imperative Primitive

### 4.1 File structure

```
apps/admin/src/ui/overlay/context-menu/
├── index.ts            // public surface
├── types.ts            // ContextMenuItem, OpenContextMenuOptions
├── store.ts            // external store (useSyncExternalStore-friendly)
├── open.ts             // openContextMenu(), closeContextMenu(), useContextMenu()
├── host.tsx            // <ContextMenuHost /> mounted once in providers.tsx
├── trigger.tsx         // <ContextMenuTrigger> render-prop wrapper
└── items.tsx           // internal item renderers (Item / CheckboxItem / Submenu)
```

`index.ts` exports `openContextMenu`, `closeContextMenu`, `ContextMenuHost`, `ContextMenuTrigger`, `useContextMenu`, and the `ContextMenuItem` type.

### 4.2 Public API — `types.ts`

```ts
export type ContextMenuItem =
  | {
      kind?: 'item'
      label: ReactNode
      icon?: LucideIcon
      shortcut?: string      // display only, e.g. '⌘↵'
      danger?: boolean
      disabled?: boolean
      onSelect: () => void
    }
  | {
      kind: 'checkbox'
      label: ReactNode
      checked: boolean
      onCheckedChange: (next: boolean) => void
      disabled?: boolean
    }
  | {
      kind: 'submenu'
      label: ReactNode
      icon?: LucideIcon
      items: ContextMenuItem[]
    }
  | { kind: 'separator' }
  | { kind: 'label'; label: ReactNode }

export interface OpenContextMenuOptions {
  /** If provided, anchor = { x: event.clientX, y: event.clientY } and preventDefault() is called. */
  event?: MouseEvent | ReactMouseEvent
  /** Override anchor explicitly. Wins over event coordinates. */
  anchor?: { x: number; y: number }
  /** Identifier of the source trigger; used by ContextMenuTrigger to surface `active`. */
  triggerId?: string
  /** The menu items. Function form is evaluated immediately by openContextMenu(). */
  items: ContextMenuItem[] | (() => ContextMenuItem[])
}
```

### 4.3 Public API — `open.ts`

```ts
export function openContextMenu(options: OpenContextMenuOptions): void
export function closeContextMenu(): void
export function useContextMenu(): {
  isOpen: boolean
  openTriggerId: string | undefined
  open: typeof openContextMenu
  close: typeof closeContextMenu
}
```

`openContextMenu` behavior:

1. If `options.event` is given, call `event.preventDefault()`.
2. Resolve anchor: `options.anchor ?? { x: event.clientX, y: event.clientY }` (default `{ x: 0, y: 0 }` if neither given).
3. Resolve items: if a function, invoke it now to get the array.
4. Mutate the singleton store: `{ open: true, anchor, items, triggerId }`. If a menu is already open, it is replaced (the previous trigger's `active` state will flip off automatically).

`closeContextMenu` mutates the store to `{ open: false }`. The `items`, `anchor`, and `triggerId` are kept for one render tick so the close animation has data to render against — they are cleared on the next `open`.

### 4.4 Public API — `host.tsx`

`<ContextMenuHost />`:

- Mounted once, alongside `<ModalRoot />`, inside `AppProviders` (`apps/admin/src/providers.tsx`).
- Subscribes to the store via `useSyncExternalStore`.
- Renders Base UI `Menu` (not `ContextMenu` — we drive trigger imperatively):

  ```tsx
  <Menu.Root open={state.open} onOpenChange={(next) => !next && closeContextMenu()}>
    <Menu.Portal>
      <Menu.Positioner anchor={virtualAnchor}>
        <Menu.Popup>
          {state.items.map(renderItem)}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>
  ```

- `virtualAnchor` is a memoized `{ getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }`.
- Item dispatch (`renderItem`) recurses over the items tree:
  - `item` → `<Menu.Item onClick={() => { item.onSelect(); closeContextMenu() }}>`
  - `checkbox` → `<Menu.CheckboxItem checked onCheckedChange>` (does not auto-close)
  - `submenu` → `<Menu.SubmenuRoot>` with `<Menu.SubmenuTrigger>` + nested `<Menu.Portal>/<Menu.Positioner>/<Menu.Popup>` rendering its `items`
  - `separator` → `<Menu.Separator />`
  - `label` → `<Menu.GroupLabel>`

Styles follow `select.tsx` conventions:

- Popup: `outline-hidden rounded border border-neutral-200 bg-white text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-950`, min width ~ 200px, max width 320px.
- Item: `outline-hidden flex cursor-default select-none items-center gap-2 rounded px-2 py-1.5 text-neutral-700 data-[highlighted]:bg-neutral-100 dark:text-neutral-200 dark:data-[highlighted]:bg-neutral-800`.
- Danger item: adds `text-red-600 data-[highlighted]:bg-red-50 dark:text-red-400 dark:data-[highlighted]:bg-red-950/30`.
- Icon: `size-4 shrink-0 text-neutral-400`.
- Shortcut: `ml-auto text-xs text-neutral-400`.
- Submenu trigger arrow: `<ChevronRight />` at far right.

`z-index` integration: use `PortalLayerScope` + `useFloatingZ('popover')`, same as `SelectField`.

### 4.5 Public API — `trigger.tsx`

`<ContextMenuTrigger>` — render-prop wrapper that does NOT render its own DOM node. Children receive `(triggerProps, state)` so the caller decides the element.

```ts
interface ContextMenuTriggerProps {
  items: ContextMenuItem[] | (() => ContextMenuItem[])
  disabled?: boolean
  children: (
    triggerProps: { onContextMenu: ReactMouseEventHandler },
    state: { active: boolean },
  ) => ReactElement
}
```

Implementation:

- `useId()` produces a stable `triggerId`.
- Subscribes to `useContextMenu()`; computes `active = state.isOpen && state.openTriggerId === triggerId`.
- `onContextMenu` handler: if `disabled`, return; otherwise `openContextMenu({ event, items, triggerId })`.
- Returns `children({ onContextMenu }, { active })`.

### 4.6 Provider integration

`apps/admin/src/providers.tsx` mounts `<ContextMenuHost />` next to `<ModalRoot />`:

```diff
       <I18nProvider>{props.children}</I18nProvider>
       <ModalRoot />
+      <ContextMenuHost />
       <Toaster ... />
```

## 5. Menu items per row type

### 5.1 `PostRow` (`apps/admin/src/features/posts/components/PostRow.tsx`)

`buildPostMenuItems(post, handlers, categories): ContextMenuItem[]` returns:

```
✎ 编辑                                ↵
↗ 在新窗口打开                        ⌘↵
👁 预览
─────────────────────────────────────
☐ 已发布
☐ 置顶
📁 修改分类                          ▸  (submenu: 全部 categoriesQuery.data)
─────────────────────────────────────
  复制链接
  复制 ID
  复制 slug
─────────────────────────────────────
🗑 删除                              ⌫  (danger)
```

- "修改分类" submenu items: for each category, `{ label: category.name, onSelect: () => onCategoryChange(post.id, category.id) }`. The currently-selected category is rendered with a leading check (an `icon: Check` in items).
- "已发布" / "置顶" use `kind: 'checkbox'`.
- Copy items use `navigator.clipboard.writeText(...)` plus `toast.success('已复制')`.
- 删除 reuses the existing `window.confirm` + `deleteMutation`.

"修改标签" is not added in this iteration (multi-select with create-new is too large for a submenu). Tags remain edit-only via the editor page. (Mark as TODO if revisited.)

### 5.2 `NoteRow` (`apps/admin/src/features/notes/components/NoteRow.tsx`)

```
✎ 编辑                                ↵
↗ 在新窗口打开                        ⌘↵
👁 预览
─────────────────────────────────────
☐ 已发布
☐ 收藏
☐ 隐藏
─────────────────────────────────────
  修改心情                          (opens small prompt-like submenu with text input + 保存)
  修改天气                          (same shape)
─────────────────────────────────────
  复制链接
  复制 ID
  复制 #编号 (nid)
─────────────────────────────────────
🗑 删除                              ⌫  (danger)
```

- "修改心情" / "修改天气" implementation: each menu item is `kind: 'item'` whose `onSelect` calls the project's existing `present()` imperative modal (`~/ui/feedback/modal-imperative`) with a small one-field form. Submitting the form calls the same `patchNote` mutation used today by `InlineTextEdit`. (Reason: Base UI submenus are designed for menu-style keyboard navigation; embedding a free-form `<input>` would fight that. Using `present()` keeps the pattern consistent with other admin edits.)
- Copy nid copies the textual `#${nid}` so users can paste a reference.

### 5.3 Right-side action icons (both row types)

Three icons in fixed order:

| Icon | Action |
|------|--------|
| `Pencil` | `<Link to={editPath}>` — same target as the title link |
| `ExternalLink` | `<a href={externalHref} target="_blank">` |
| `MoreHorizontal` (⋯) | `<button>` whose `onClick` reads its own bounding rect and calls `openContextMenu({ anchor: { x: rect.right, y: rect.bottom }, triggerId, items })` — opens the same menu as right-click, anchored to the icon |

Default state: `text-neutral-300 dark:text-neutral-700`.
On `article:hover` (or `data-context-menu-active`): cascade to `text-neutral-600 dark:text-neutral-300` (via `group-hover:` on the row).
Each icon button still gets its own `hover:bg-neutral-100 dark:hover:bg-neutral-800` ring on direct hover.

## 6. Affected files

**New files**

- `apps/admin/src/ui/overlay/context-menu/index.ts`
- `apps/admin/src/ui/overlay/context-menu/types.ts`
- `apps/admin/src/ui/overlay/context-menu/store.ts`
- `apps/admin/src/ui/overlay/context-menu/open.ts`
- `apps/admin/src/ui/overlay/context-menu/host.tsx`
- `apps/admin/src/ui/overlay/context-menu/trigger.tsx`
- `apps/admin/src/ui/overlay/context-menu/items.tsx`
- `apps/admin/src/features/posts/components/buildPostMenuItems.ts`
- `apps/admin/src/features/notes/components/buildNoteMenuItems.ts`

**Modified files**

- `apps/admin/src/providers.tsx` — mount `<ContextMenuHost />`.
- `apps/admin/src/features/_shared/components/content-list-item.tsx` — restructure `ContentEntryListItem`:
  - Wrap the `<article>` in a `<ContextMenuTrigger>` (props accept `menuItems?: ContextMenuItem[] | (() => ContextMenuItem[])`).
  - Replace the four action buttons with three persistent dimmed action slots (edit, external, more).
  - Drop the inline `actions` prop; rename to internal action computation.
  - Apply the `active` class when context menu is open.
- `apps/admin/src/features/posts/components/PostRow.tsx`:
  - Remove the inline `SelectField` for category — category renders as a chip.
  - Pass `menuItems={() => buildPostMenuItems(post, handlers, categories)}` to the row primitive.
- `apps/admin/src/features/notes/components/NoteRow.tsx`:
  - Remove the two `InlineTextEdit` widgets; mood/weather render as text-only chips.
  - Pass `menuItems={() => buildNoteMenuItems(note, handlers)}`.
- `apps/admin/src/features/notes/components/InlineTextEdit.tsx` — delete. Mood/weather editing moves to `present()` modal triggered from the context menu; the inline component has no remaining call sites after `NoteRow` is updated.

**Unchanged**

- `PostsRouteViewContent`, `NotesRouteViewContent` (header / toolbar / pagination).
- API layer (`api/posts.ts`, `api/notes.ts`).
- Routing.

## 7. Behavior details

- **Action icons hover cascade.** The row is a `group`; the action slot uses `group-hover:text-neutral-600` so brightness changes are tied to row hover, not icon hover. Layout never shifts because icons are always rendered.
- **`active` state.** When the menu is open, the row receives `data-context-menu-active=""`. CSS `data-[context-menu-active]:bg-neutral-100 dark:data-[context-menu-active]:bg-neutral-800`.
- **Mobile / touch.** No right-click on touch devices. The `⋯` icon is the touch-friendly fallback (taps open the menu anchored on the icon). Long-press is out of scope.
- **Keyboard.** Focus on a row + `Enter` follows the title link (already wired by `<Link>`). The `⋯` button is reachable via Tab; `Enter` on it opens the menu. Inside the menu, Base UI provides Up/Down/Esc/Enter naturally.
- **Bulk selection unchanged.** Selecting a row via the checkbox does not open the menu; selection bar logic stays in `ContentListToolbar`.
- **Loading & error states.** Skeleton / empty / error states inside the list are unchanged.

## 8. Out of scope (future work)

- Tag multi-select editor in the menu.
- Drag-and-drop reordering.
- A keyboard shortcut layer (`?`-style command palette) — only display hints in menu now.
- Replacing `confirm()` / `prompt()` fallbacks with the project's `present()` modal API.
- Migrating other list pages (drafts, comments) to the same context-menu primitive — they already use master-detail, the primitive is available but not retrofitted in this scope.

## 9. Acceptance checklist

- [ ] `openContextMenu` opens a menu at the cursor with the supplied items, replaces any open menu, and closes on Esc / outside click / item select (non-checkbox).
- [ ] Two menus cannot be open at once.
- [ ] `<ContextMenuTrigger>` provides `active=true` while its menu is open and `false` otherwise; opening another row's menu flips the previous row's `active` to false.
- [ ] PostRow / NoteRow show two-line layout, no inline-edit widgets, persistent dimmed action icons, and open the correct context menu on right-click or on `⋯` click.
- [ ] Toolbar (filter / sort / search / bulk delete) and pagination behavior is identical to before the redesign.
- [ ] No layout shift on hover.
- [ ] Dark mode mirrors light mode for all new colors.
- [ ] Lint + typecheck on the touched files pass.
