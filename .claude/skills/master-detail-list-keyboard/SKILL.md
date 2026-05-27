---
name: master-detail-list-keyboard
description: Mandatory recipe for wiring j/k/↑/↓ keyboard navigation in admin-vue3 master-detail list panes. Apply when adding `useListKeyboard` to any list, building a new master-detail view, refactoring `ListRow` consumers, or whenever the user complains that "hjkl moves but the selected row doesn't update" / "键盘移动没有高亮" / "j/k 没反应" / "detail 不跟着键盘走" / "panel 打开后 j/k 切 item 右侧不刷新" / "edit drawer 不随键盘切换". Triggers on `useListKeyboard`, `FocusScope`, `ListRow`, `selection.selectOne`, `onItemFocus`, master-detail keyboard nav, drawer/panel-sync-with-keyboard.
---

# master-detail list keyboard wiring (MUST)

## The trap

`useListKeyboard` exposes a `selection` model intended for **multi-select**. By default it calls `selection.selectOne(focusedId)` on every j/k tick. But the row's visual `selected` prop is **NOT auto-wired** — you must read `selection.isSelected(id)` yourself, otherwise pressing j/k changes nothing visible and the user thinks the keyboard is dead.

This bug bites every new master-detail page. Always recur. Hence this skill.

## The contract

Two distinct cases. **Pick one per scope** and wire it end-to-end.

### Case A — Outer master list (j/k drives the detail target)

This is the mail-client feel: arrow keys preview the next item by opening it in the detail pane.

```tsx
useListKeyboard<Article>({
  scopeId: 'foo-articles',
  items: articles,
  getId: (a) => a.id,
  resetOn: [search],
  // 1. override default: drive the detail target, not the internal selection
  onItemFocus: (id) => {
    const article = articles.find((a) => a.id === id)
    if (article) setSelectedArticleId(article.id)
  },
  actions: [
    {
      key: 'open',
      label: 'Open',
      shortcut: 'Enter',
      run: (targets) => {
        const t = targets[0]
        if (t) setSelectedArticleId(t.id)
      },
    },
  ],
})

// row:
<ArticleRow
  selected={article.id === selectedArticleId}   // 2. selected = detail target
  isDetailTarget={article.id === selectedArticleId}
  onSelect={() => setSelectedArticleId(article.id)}
/>
```

**Both `onItemFocus` and `selected={... === selectedDetailId}` are required.** Without the override, j/k only mutates an internal selection model that nothing renders.

### Case B — Inner detail list (j/k highlights, Enter opens edit)

For a list inside the detail pane — e.g. summary rows under an article — j/k should highlight the focused row, NOT auto-open the editor. Use the hook's selection model directly:

```tsx
const { selection } = useListKeyboard<Item>({
  scopeId: 'foo-items',
  items,
  getId: (it) => it.id,
  resetOn: [parentArticleId],
  // no onItemFocus — default `selection.selectOne(id)` is correct
  actions: [
    { shortcut: 'Enter',     run: (t) => openEditDrawer(t[0]) },
    { shortcut: 'Backspace', run: (t) => confirmDelete(t[0]) },
  ],
})

// row:
<ItemRow
  selected={selection.isSelected(item.id)}   // ← read from selection model
  onSelect={() => openEditDrawer(item)}
  onDelete={() => confirmDelete(item)}
/>
```

**Reading `selection.isSelected(id)` is required** — it's the only place the j/k focus state surfaces.

#### Click → must also call selection.selectOne

Mouse clicks do NOT update the selection model automatically. ListRow's click handler only fires `onSelect(mode)`. If your row's visual `selected` is bound to `selection.isSelected(id)` (per Case B), clicking won't highlight the row — only j/k will. To make clicks behave the same as j/k, call `selection.selectOne(id)` in the click handler:

```tsx
<ItemRow
  selected={selection.isSelected(item.id)}
  onSelect={(mode) => {
    if (mode === 'toggle') selection.toggle(item.id)
    else if (mode === 'range') selection.selectRange(item.id)
    else {
      selection.selectOne(item.id)   // ← required for click highlight
      openEditDrawer(item)
    }
  }}
/>
```

(Drafts' `DraftsRouteViewContent.tsx` is the canonical example.)

#### When an external panel/drawer is open, sync target on j/k

If clicking an item opens an edit drawer / right-side panel, the user expects j/k to **also** swap the drawer's target while the drawer is open. Without this, the drawer is stuck on the originally-clicked item even though the highlight has moved.

Override `onItemFocus` to call `selection.selectOne` (preserve the highlight) **and** the external sync callback. Gate the sync on whether the drawer is currently open so j/k never opens a closed drawer from scratch:

```tsx
const { selection } = useListKeyboard<Item>({
  scopeId: 'foo-items',
  items,
  getId: (it) => it.id,
  resetOn: [parentArticleId],
  onItemFocus: (id) => {
    selection.selectOne(id)                       // ← preserve default highlight
    const item = items.find((it) => it.id === id)
    if (item) onItemFocus?.(item)                 // ← inform parent
  },
  actions: [/* Enter, Backspace */],
})
```

…and at the parent, gate the sync:

```tsx
<DetailPane
  onItemFocus={(item) => {
    if (editingItemId !== null) {
      setEditingItemId(item.id)   // ← only when drawer is already open
    }
  }}
/>
```

Also: when an edit drawer's body owns local state (`useState` initialized from props), give it `key={editingItem.id}` so it remounts on item switch — otherwise the form keeps the old item's values.

```tsx
<EditDrawerBody
  item={editingItem}
  key={editingItem.id}   // ← required when switching items inside an open drawer
  ...
/>
```

## Forbidden

- `selected={false}` constant on a `ListRow` inside a `FocusScope`. Means j/k is dead.
- Wiring `selected={detailId === id}` while not passing `onItemFocus`. j/k advances the internal selection model invisibly; the user sees no movement.
- Two scopes using the same `scopeId` on one page — `FocusScope` ids must be unique per page (use a `scopeIdPrefix` and append `-articles` / `-items`).
- Auto-opening an edit drawer / modal from `onItemFocus`. That maps Up/Down to "open editor", which feels broken. Use `onItemFocus` only to drive **already-visible** state (the detail target, a preview, a highlight).
- Forgetting `<FocusScope id={scopeId}>` around the rows. `useListKeyboard` is scope-gated; without the wrapper, nothing fires.

## Checklist when reviewing a list pane

1. Is there a `<FocusScope id={scopeId}>` around the row list? If no — keyboard nav is silently broken.
2. Does `useListKeyboard` get the same `scopeId`? Mismatch → silent breakage.
3. What drives `selected` on the row?
   - If `selection.isSelected(id)` → Case B. If you override `onItemFocus`, call `selection.selectOne(id)` yourself first.
   - If `someExternalId === id` → Case A. Must pass `onItemFocus` that updates `someExternalId`.
   - If literal `false` → bug.
4. Does `resetOn` include the inputs that should clear focus (filter changes, search changes, parent article switch)? Without it, j/k can land on a stale id after list reshape.
5. Does **clicking** a row update `selected` visually? If `selected` reads from `selection.isSelected(id)`, the row's `onSelect` handler must call `selection.selectOne(id)` — mouse clicks do not auto-update the selection model.
6. If an edit drawer / right-side panel opens from the row, does j/k update it while it's open? Override `onItemFocus` to fire an external sync (gated on drawer open) AND keep `selection.selectOne(id)`. Pass `key={item.id}` to the drawer body so its local state resets on item switch.

## Reference views to copy

- `apps/admin/src/features/drafts/components/DraftsRouteViewContent.tsx` — Case B canonical (selection drives `selected`, Enter opens detail through the action registry).
- `apps/admin/src/features/ai/components/article-grouped/ArticleListPane.tsx` — Case A canonical (j/k drives the article-detail target).
- `apps/admin/src/features/ai/components/article-grouped/ArticleDetailPane.tsx` — Case B canonical (inner item list).

## Why a hook exposes both

`useListKeyboard` was built for multi-select lists (posts, notes, comments) where the selection model owns checkbox state AND focus visuals. For master-detail single-target, the selection model is the wrong source of truth — the URL-synced detail id is. Don't fight the hook; just pick the right case above. If a project-wide `useMasterDetailKeyboard` wrapper materializes, prefer it.
