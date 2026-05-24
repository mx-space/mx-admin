# House Shell · Design

**Date**: 2026-05-23
**Phase**: design redirect (pre-implementation)
**Relates to**: [00-roadmap.md](../2026-05-06-react-migration/00-roadmap.md), [STATUS.md](../2026-05-06-react-migration/STATUS.md)
**Status**: direction approved 2026-05-23 — execution mode TBD

---

## Premise

The migration to date (P0 → P2 in progress, RightPane quick-edit on 2026-05-11) shipped a Linear-aligned dark canvas with lavender accent, inset-card shell, and `<DataTable>` as the primary list surface. Visual fatigue with that direction triggered a re-brainstorm on 2026-05-23.

The conclusion is a different design language altogether: a personal study (`斋`) of six rooms that share typography and palette but adapt layout per intent. Anti-SaaS in posture, typography-first in execution, subtractive in chrome.

This spec is the directional commitment. It supersedes the visual / structural decisions in specs 02, 03, 07, 08 (presentation only), 09 (frame only), 10 (theming only), 11 (per-view layout), and 12. The data layer (04, 05, 06) is preserved end-to-end.

---

## The metaphor

`斋` — a private study with six rooms. The shell is one person's tool, not a SaaS product.

| Room | Metaphor | Views (from spec 11) |
|---|---|---|
| 手记 Diary | a chronological river | dashboard, analyze, posts/notes/pages lists, says, recently, comments, readers, drafts |
| 写字台 Desk | a sheet of paper on a desk | posts/edit, notes/edit, pages/edit |
| 架子 Shelves | contact sheet + address book | files (list/orphans/comment-images), projects, friends |
| 偏好册 Booklet | a self-administered booklet | setting/\*, posts/category, notes/topic, subscribe, markdown helper, webhooks |
| 工坊 Workshop | a craftsman's bench (lamp-lit) | snippets, template, cron, backup, debug/\*, dev/\* |
| 学徒 Apprentice | an assistant who returns work to the diary | ai/\* (all six views) |

Outside the house: **Front door** — `login`, `setup`, `setup-api`. Letterhead pages, distinct surface.

---

## Decisions

### D1 — Typography is the spine

All rooms share typography. Layout adapts; type does not.

- Serif (body, titles, hints): `Iowan Old Style → Charter → Source Serif Pro → Georgia → serif`
- Sans (metadata, date stamps, action labels): system stack
- Mono (code in Workshop only): `JetBrains Mono → SF Mono → Menlo → monospace`
- Italic = quiet / prompt / marginalia (NOT for emphasis).
- Numerals: old-style figures where the typeface supports them.

### D2 — Two palettes (paper, lamp)

Workshop always uses **lamp**. Other rooms use **paper** by default. A global override may switch the whole house to lamp; Workshop never switches to paper.

```
paper / day
  bg              #f5ede0   cream — the page
  surface         #ede2c8   envelope, inspector
  sunken          #efe6d4   TOC sidebar, chapter rail
  ink             #2a2520   primary text
  muted           #5a4f38   secondary text
  faint           #8a7a55   meta text
  hint            #7a6a48   italic notes
  accent          #6b5840   deep ink — selected, peak, current
  accent-soft     #a89568   matte gold — chart bars, dividers
  highlight       #f5e8b0   live edit, new arrival
  divider         rgba(58,47,30,0.16)
  dash-divider    #c4b89a

lamp / night (Workshop, optional global)
  bg              #1a1612   dark wood
  surface         #0e0b08   editor canvas
  sunken          #08070a   log gutter
  text            #d8d0b8   warm cream
  muted           #c8c0a8
  faint           #7a6a48
  accent          #c8a868   oil amber
  accent-soft     #a89868
  success         #b8d8a8   ✓
  warn            #d8a868   ⚠
  glow            radial(80% 0%, rgba(200,168,104,0.06), transparent 50%)
  highlight       rgba(200,168,104,0.18)
```

Forbidden:

- No HSL gradients on surfaces
- No SaaS-bright hues (lavender, mint, fuchsia, electric blue)
- No glassmorphism, no neumorphism
- No filled iconography (see D4)

### D3 — Subtractive chrome

No persistent navigation. No toolbars. No always-visible action bars.

Per room/page:

- **Top**: `斋 · <room> · <breadcrumb>` (sans-uppercase ~10px, opacity ~0.42) + room title (serif 22–34px)
- **Top right**: 1–3 lines of sans-10px hints — `⌘K · jump`, `⌘N · write`
- **Body**: the content. No nav rail.
- **Bottom**: contextual hints (sans-10px, italic where applicable) — `← yesterday · May 22`, `↑ Reading · ↓ Writing`
- **Letterpress bar** (D8) appears only on selection, pinned bottom-center.

`⌘K` (kbar) is the only cross-room nav primitive. On mobile, tap the room name in top chrome to open a rooms sheet.

### D4 — Actions are textual, not iconographic

`edit · publish · archive` as words. No pencil / arrow / trash icons.

Allowed glyphs (serif-punctuation tier): `▸ ▾ ▴ ← → ↑ ↓ ⌘ ⌥ ⌫ ↵ esc`. Allowed utility marks (sparingly): `✓ ⚠`. No filled or outlined icon sets.

Hover reveals actions on entries. Keyboard shortcuts are listed at section ends (`⌘E edit · ⌘P publish · ⌘⌫ archive`).

### D5 — Diary is the spine

The "Today" page IS the dashboard. Lists are diary segments. Charts are paragraphs with figures, not widgets.

Every list view feels like the same diary, filtered. Charts in `dashboard` live in a `— this week's ledger —` section, sentence-led: `▸ You wrote 4 posts this week, [sparkline]`. Tag clouds render as italic words sized by weight; no cloud library.

### D6 — Writing desk: metadata on the right, agent in a drawer

**User feedback 2026-05-23:** the editor's right column is for metadata editing (pragmatic), NOT for agent margin notes. Agent moves to a `⌘K`-triggered drawer (desktop) or bottom sheet (mobile). `<Marginalia>` is reserved for finished, accepted annotations that land as actual page notes.

- Editor frame: full-bleed paper. Title is the page heading. Body flows.
- Right column `<Inspector>`: metadata fields (slug, summary, category, tags, allow-comments, copyright, post-date, hidden). Italic prompt + underlined answer; field-level autosave.
- `<Envelope>`: secondary surface — less-used metadata or draft history. `⌘M` slides over the page (desktop) or pulls up from bottom (mobile).
- Drafts: `if you leave, this draft will keep itself` is an inline italic notice triggered by `useBlocker(isDirty)`. No modal.

### D7 — Three editing patterns share one visual language

- `<Field>` — single labeled value. Italic serif prompt (`— what is your blog called?`) + underlined `<input>`. Field-level autosave shown as italic `— saved 1 s ago —` in chapter header.
- `<Inspector>` — right column in Shelves rooms and Writing desk. Holds many `<Field>` plus a textual action row (`replace · copy URL · remove`).
- `<Booklet>` — multi-chapter form layout (Settings / Categories / Hooks). Left TOC with roman numerals (`i. About · ii. Your site · …`), right chapter body. Prev/next at chapter foot (`↑ Reading · ↓ Writing`).

### D8 — Letterpress action bar (bulk actions)

On selection (`⌘-click`, `shift-click`), a deep-ink pill appears pinned bottom-center. Disappears on `esc`. **No checkboxes in the list itself.** The list's left gutter switches from `MAY · 23` to `✓ MARKED` and a 2-px accent rule appears on the row.

```
— 2 entries marked — | ⌘E edit · ⌘P publish · ⌘⌫ archive · esc
```

### D9 — Apprentice returns to the diary

AI tasks DO NOT live in a persistent float button. The apprentice's progress and finished work flow into 手记 as dated entries with a left-stamp `— a note from the apprentice —`. The entry uses a soft horizontal gradient that fades over ~800ms on arrival.

`⌘K` jumps to the Apprentice's desk for detail. **This closes spec 11 open question #2** (AI float button placement) — the answer is "no float button."

### D10 — Charts (recharts) themed

`recharts` (already in repo since 2026-05-10) stays as the chart engine. A global theme provider drives axis / grid / text / palette from paper or lamp tokens. New paper-native chart primitives wrap recharts (or render directly via SVG when simpler):

- `<Sparkline>` — inline narrative figure
- `<BarRow>` — short horizontal bar chart
- `<Donut>` — multi-segment circle, sepia ramp
- `<TagCloud>` — italic words sized by weight, NOT a chart lib

Rules:

- One accent (paper `#6b5840`, lamp `#c8a868`).
- Ramps are monochrome sepia: `#6b5840 → #a89568 → #c8b878 → #d8c8a0`.
- No tooltip popovers; annotate inline (`↑ rewrite essay · May 12` in italic serif).
- Peak / current is the only color emphasis; non-peak bars share opacity 0.7–0.9.

### D11 — Mobile rules

No sidebar to collapse (none exists desktop-side). Master-detail collapses to list + right-overlay drawer with 14-px back-affordance (the underlying list edge is visible and fingerable).

Per surface:

- Diary → already single-column, fits naturally.
- Editor → `<Envelope>` and apprentice drawer become bottom tabs (`envelope ▴`, `apprentice · 2 notes`).
- Booklet → `≡ chapters` taps a full-screen TOC sheet (roman i–ix).
- Shelves Inspector → bottom sheet, draggable handle, drag-down to dismiss.
- Letterpress bar → bottom-pinned same as desktop; `esc` is `swipe-down`.
- Workshop Monaco → horizontal scroll + soft-wrap toggle in top chrome.

### D12 — Realtime arrivals as entries (not toasts)

New comment / new reader / apprentice finish → inserted into 手记 as a dated entry with a soft pulse (horizontal gradient fade over ~800ms). User acks inline (`read · ↵`, `attach to post`, `ignore`). No toast.

`sonner` toasts remain for transient operational confirmations (`saved`, `removed`, errors). Restyled: italic serif text, no icons, paper / lamp palette, very quiet.

---

## Primitive impact

### Replaced (rewrite required)

| Existing | Replacement | Notes |
|---|---|---|
| `AppShell` + `Sidebar` + `UserChip` | `<Room>` + top chrome | No persistent sidebar. User actions via `⌘K`. |
| `FullLayout` / `TwoColLayout` / `FullPage` / `TwoColPage` | `<Stream>` / `<Inspector>` / `<Booklet>` | Layout primitives become metaphor-named. |
| `<DataTable>` (2026-05-10 v1) | `<Stream>` of `<Entry>` | No tables in user-facing views. Bulk actions via D8. `@tanstack/react-table` may be kept if `/analyze` ever needs a true tabular surface — TBD. |
| `<Card>` (Linear-flavored inset-card) | drop entirely | Cream surfaces don't card. Inspector + Envelope are surface-tinted, not cards. |
| `<Modal>` / `<Drawer>` | keep mechanism, replace surface | Cream surface, no shadow card, ≤ 2-px radius, italic prompts. |
| `<Tabs>` | keep mechanism, replace surface | Roman numerals + serif in Booklet. Underline variant retained for Workshop. |
| `<Tooltip>` | keep, restyle | Quiet italic, no arrow, slow fade. |
| `<Pagination>` | replace surface | "← load earlier · April · 56 more" pattern; no numeric pagination. |
| `<Sonner>` toast | keep, restyle | Italic serif, no icons, palette-aware. |
| `<Sidebar>` org chip | move | Org chip lives only on Letterhead pages (login / setup). |
| `<CommandPalette>` (kbar) | keep, restyle | Same Base UI mechanism; cream surface, italic placeholders, no border-radius excess. |

### New primitives

| Primitive | Purpose |
|---|---|
| `<Room>` | Page wrapper. Owns top chrome (breadcrumb / title / hints). |
| `<Stream>` | Vertical river of `<Entry>` with three columns: date-gutter / body / meta. |
| `<Entry>` | Single dated item. States: `draft`, `post`, `letter`, `visitor`, `awaits`, `archived`, `marked`, `pulsing`. |
| `<Inspector>` | Right column for Shelves / Desk. Surface-tinted (`surface` token). |
| `<Envelope>` | Backside-of-page surface. `⌘M` toggles desktop; bottom tab pulls up on mobile. |
| `<Booklet>` | TOC + chapter layout. Auto-generates roman numerals from `<Chapter>` order. |
| `<Chapter>` | Section in a Booklet. Title + saved-state header + body. |
| `<Marginalia>` | Right gutter for finished annotations (accepted agent suggestions, editorial notes). |
| `<LetterpressBar>` | Bottom-pinned action pill, visible only when selection is active. |
| `<Field>` | Italic prompt + underlined answer. Variants: text / textarea / yes-no / radio-row / file. |
| `<Choice>` | Inline `yes · no` / `option · option` selector. Current is underlined. |
| `<Sparkline>` / `<BarRow>` / `<Donut>` / `<TagCloud>` | Paper-native chart primitives. |
| `<Lamp>` | Wrapper that switches palette to lamp (Workshop, or global theme). |
| `<Letterhead>` | Front-door full-bleed page (login / setup). |

### Preserved (no change)

- Zustand stores: auth, theme, layout, ui (theme expands to add `lamp` flag).
- Jotai atom catalog (`sidebarMobileOpenAtom` repurposed as `roomPickerOpenAtom`).
- TanStack Query + persist + queryKeys + socket bridge + `auth-events`.
- Routing topology and `ProtectedRoute` / `SetupGuard`.
- TanStack Form + zod (Standard Schema); only presentation rewrites.
- Lexical / Shiro RichEditor mechanism (frame replaced).
- Recharts engine (theme override added).
- `useDrafts` / `useEffectivePost` / `useTableQuery` / `useDataTable` (the latter only if `/analyze` needs tables).

---

## What this redirects (per-spec impact)

| Spec | Status before | Impact |
|---|---|---|
| 01 repo skeleton | complete | None. |
| 02 design tokens | calibrated (v2), Linear-aligned | **Rewrite end-to-end.** Paper + lamp palettes; serif type scale; semantic naming changes. |
| 03 UI primitives | P2 complete | Most primitives kept as mechanisms but restyled. `<Card>` dropped. 12 new primitives to build. |
| 04 state layer | P0 complete | None. |
| 05 data layer | P1 in progress | None. |
| 06 routing + auth | P1 in progress | None. Letterhead surface for login / setup. |
| 07 layouts + patterns | P1 in progress | `AppShell` / `Sidebar` / `FullLayout` / `TwoColLayout` / `SetupLayout` all replaced. |
| 08 form system | core shipped | TanStack Form kept; `<Field>` / `<Choice>` / `<Booklet>` replace current presentation. |
| 09 editors | RichEditor shipped | Lexical mechanism kept; frame becomes 写字台 (`<Desk>` + `<Inspector>` + `<Envelope>`). Toolbar dropped. |
| 10 charts + misc | recharts shipped | Theme override; new chart primitives; tag cloud reimplemented as italic words; kbar visual restyle. |
| 11 views migration | posts/view + posts/edit shipped | Re-port required for already-shipped views (dashboard, login, setup, posts/view, posts/edit). |
| 12 table effort | v1 shipped | Superseded by `<Stream>` for user-facing views. `<DataTable>` may survive if `/analyze` needs a real table. |

---

## Cost estimate (one engineer, rough)

| Track | Effort |
|---|---|
| Token rewrite (paper + lamp + type scale + font loading) | 1–2 days |
| 12 new primitives + restyle of kept primitives + Storybook-equivalent mockup page | 1–2 weeks |
| Layout + chrome + kbar restyle | 4–5 days |
| recharts theme override + 4 chart primitives | 2–3 days |
| Editor frame swap (`<Desk>` + `<Inspector>` + `<Envelope>` + drawer agent) | 3–4 days |
| Per-view re-port (~30 views) | 3–5 weeks |
| Realtime polish (pulse animation, apprentice entry styling) | 2 days |
| E2E smoke shift (new selectors, new flows) | 2–3 days |
| **Total** | **~6–9 weeks** |

This is a directional reset on top of preserved data, routing, state, and form layers. It is not a refactor.

---

## Open questions

1. **Theme switch surface.** Paper is the default. Lamp is mandatory in Workshop. Should the user be able to set lamp globally? Or is paper-with-Workshop-exception the right invariant?
2. **Front door theme.** Letterhead pages on the same cream paper as the rest, or a slightly distinct "outdoor" feel (cooler ink, no warm cream)?
3. **Workshop entrance animation.** Palette switch on room entry — instant, animated, or marked only by a `— stepping into the workshop —` italic line?
4. **Charts on lamp.** When `/analyze` runs in a globally-lamp world, the sepia ramp inverts. Need a parallel ramp.
5. **Print stylesheet.** Paper aesthetic is print-ready by accident. Worth shipping a `@media print` polish for at least 手记 and 偏好册?
6. **Iconography exception scope.** D4 lists allowed glyphs. Edge cases: `⊕` for add? `↻` for reload? `🛈` for info? Default: no — fall back to text words.
7. **Agent drawer trigger.** `⌘K` opens the rooms picker today. Does agent get its own shortcut (`⌘\\`?) or share `⌘K` with a `> agent` prefix?

---

## Reference mockups (baseline)

All mockups produced during the brainstorming session are committed under `mockups/`. They are the **canonical visual baseline**. Token choices, copy patterns, and component anatomy in the mockups are normative for the rebuild — implementations should match unless this spec is amended.

| File | What it demonstrates |
|---|---|
| `landing.html` | The two conventional shells this redirect rejects |
| `alternatives.html` | Four alternatives considered before settling on diary |
| `anti-saas.html` | Personal-feel alternatives within the diary family |
| `diary-today.html` | The Today (home) page — mixed entry types |
| `the-house.html` | Six-room overview |
| `diary-posts-list.html` | Stress test: 100+ posts as a stream, filter, ⌘-click select, letterpress bar |
| `desk.html` | Writing desk + Envelope (metadata) |
| `shelves.html` | Files contact-sheet + Friends correspondents |
| `booklet.html` | Settings booklet + Categories tree + Hooks "when X, ring Y" |
| `workshop.html` | Snippets (Monaco + xterm) + Cron + Backup — lamp theme |
| `apprentice.html` | AI task desk + return-to-diary as "a note from the apprentice" |
| `charts-in-diary.html` | Dashboard charts as serif narrative (sparkline + bar + donut + tag cloud) |
| `mobile.html` | Mobile collapse rules across rooms |

---

## Acceptance

This spec is a directional commitment. Implementation will land via:

1. **Token rewrite** — replace `src/styles/tokens/` end-to-end with paper + lamp palettes and serif type scale.
2. **Primitive rewrite** — build the 12 new primitives + restyle the kept ones in `src/components/ui/`. `_dev/primitives` becomes the visual regression baseline.
3. **Layout + chrome rewrite** — `<Room>` + top chrome replacing the `AppShell` family.
4. **Editor frame swap** — replace the current RichEditor frame with `<Desk>` + `<Inspector>` + `<Envelope>` + drawer-agent.
5. **Per-room view migration** — recommended order: 手记 → 写字台 → 偏好册 → 架子 → 工坊 → 学徒.

A separate execution plan will be drafted before implementation begins.

---

## Status

| Date | State | Notes |
|---|---|---|
| 2026-05-23 | direction approved | brainstormed and committed; mockups baseline frozen |

## Changelog

- 2026-05-23 — spec written, mockups committed under `mockups/`, status set to `direction approved`.
