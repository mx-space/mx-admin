# 02 · Design Tokens

**Date**: 2026-05-06
**Status**: v1 calibrated (2026-05-10)
**Owner spec**: [00-roadmap.md](./00-roadmap.md)
**Phase**: P0 (v0) → calibrated end of P1
**Depends on**: 01 (vanilla-extract plugin wired)
**Feeds**: 03 (primitives consume tokens), 07 (layouts), 09/10 (editors and charts theme)

Defines the design-token system for `admin-react`. Source of truth: the Linear dark-canvas DESIGN.md the user supplied during brainstorming. This spec maps that DESIGN into `@vanilla-extract/css` exports, lays down theme contracts, and locks the contract that primitives in spec 03 will consume.

---

## Scope

- **In**: token namespaces (color, typography, spacing, radius, elevation, motion), theme contract, dark theme implementation, font-stack policy, runtime theme switching mechanism, recipe shape conventions.
- **Out**: actual primitive components (→ 03), per-page layouts (→ 07), animation variants (→ 03 motion section).

---

## Decisions

- **Dark-first**. Ship dark theme matching Linear marketing in P0/P1. Light theme is **planned but not blocking** — the contract reserves slots, the implementation lands as a follow-up under 02b.
- **`createTheme` + `createThemeContract`** to permit a future light theme without renaming consumers.
- **Tokens live in `src/styles/theme.css.ts`** and are re-exported through a barrel for ergonomic imports.
- **Recipes** (`@vanilla-extract/recipes`) handle variants. No `sprinkles` — utility-class atoms encourage anti-patterns once primitives are in place.
- **No CSS variables defined outside the theme contract.** All runtime-tunable values flow through the contract so theme switching stays declarative.
- **Static class composition for static styling, inline `style` for motion-driven dynamic values.** css.ts is compile-time; transient interpolations belong on `style`.
- **Substitute fonts**: Inter for display + text, JetBrains Mono for mono. Linear's proprietary cuts are not available; the DESIGN spec sanctions Inter/Geist as the closest free substitute.

---

## Token namespaces

### color

Direct port of Linear's palette from DESIGN.md. Names match DESIGN identifiers exactly so a designer can cross-reference.

```ts
// src/styles/tokens/color.ts
export const color = {
  // brand
  primary: '#5e6ad2',
  primaryHover: '#828fff',
  primaryFocus: '#5e69d1',
  brandSecure: '#7a7fad',
  onPrimary: '#ffffff',

  // surface ladder
  canvas: '#010102',
  surface1: '#0f1011',
  surface2: '#181a1c',
  surface3: '#1f2124',
  surface4: '#26282b',

  // hairlines
  hairline: '#23252a',
  hairlineStrong: '#2f3137',
  hairlineTertiary: '#1a1c20',

  // inverse (for the rare white-pill CTA)
  inverseCanvas: '#ffffff',
  inverseSurface1: '#f5f5f5',
  inverseSurface2: '#ebebeb',
  inverseInk: '#0c0d0e',

  // text
  ink: '#f7f8f8',
  inkMuted: '#d0d6e0',
  inkSubtle: '#8a8f98',
  inkTertiary: '#62666d',

  // semantic
  semanticSuccess: '#27a644',
  semanticOverlay: 'rgba(0, 0, 0, 0.65)',

  // admin-only additions (not in Linear marketing — needed for an admin app)
  semanticDanger: '#e5484d',
  semanticWarning: '#f5a524',
  semanticInfo: '#3e63dd',
} as const
```

> Note: surface-1 through surface-4 hex values above are placeholders along the ladder (`#0f1011 → #26282b`). DESIGN.md sources these from Linear's `--color-bg-level-*` CSS variables but does not list exact hex per step. Confirm against the linear.app site computed styles during 02 implementation; values may shift by ~2 lightness points.

**Admin-only semantic colors** (danger / warning / info) are an explicit deviation from Linear marketing, justified because the admin surface needs alarm states the marketing site never renders. Use sparingly, never decoratively.

### typography

```ts
// src/styles/tokens/typography.ts
export const fontFamily = {
  display: "'Inter Variable', 'Inter', 'SF Pro Display', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif",
  text: "'Inter Variable', 'Inter', 'SF Pro Text', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
} as const

/** Atomic axes — pick one size + one weight when authoring a new component. */
export const fontSize = {
  xs: '11px',
  sm: '12px',
  md: '13px',
  base: '14px',
  lg: '16px',
} as const

export const fontWeight = {
  regular: '450',   // Inter Variable axis; static fonts fall back to 400
  medium: '500',
  semibold: '600',
} as const

/** Linear icon scale: 16 row-start / 14 secondary / 12 inline-with-text. */
export const iconSize = { lg: 16, md: 14, sm: 12 } as const

/** Composed presets — bundle size + weight + lineHeight + color hint. */
export const typography = {
  displayXl: { size: '80px', weight: '600', lineHeight: '1.05', letterSpacing: '-3px' },
  displayLg: { size: '56px', weight: '600', lineHeight: '1.10', letterSpacing: '-1.8px' },
  displayMd: { size: '40px', weight: '600', lineHeight: '1.15', letterSpacing: '-1px' },
  headline:  { size: '28px', weight: '600', lineHeight: '1.20', letterSpacing: '-0.6px' },
  cardTitle: { size: '22px', weight: '500', lineHeight: '1.25', letterSpacing: '-0.4px' },
  subhead:   { size: '20px', weight: '400', lineHeight: '1.40', letterSpacing: '-0.2px' },
  bodyLg:    { size: '18px', weight: '400', lineHeight: '1.50', letterSpacing: '-0.1px' },
  body:      { size: '16px', weight: '400', lineHeight: '1.50', letterSpacing: '-0.05px' },
  bodySm:    { size: '14px', weight: '400', lineHeight: '1.50', letterSpacing: '0' },
  caption:   { size: '12px', weight: '400', lineHeight: '1.40', letterSpacing: '0' },
  button:    { size: '14px', weight: '500', lineHeight: '1.20', letterSpacing: '0' },
  eyebrow:   { size: '13px', weight: '500', lineHeight: '1.30', letterSpacing: '0.4px' },
  mono:      { size: '13px', weight: '400', lineHeight: '1.50', letterSpacing: '0' },
  // Linear-aligned compact-list density (inbox / posts list / notes list / …).
  // Only TWO sizes (13/12), only TWO weights (500/450). Hierarchy comes from
  // weight + color, NOT size. line-height: normal = font-intrinsic ≈ 1.2.
  listTitle: { size: fontSize.md, weight: fontWeight.medium, lineHeight: 'normal', letterSpacing: '0' },
  listMeta:  { size: fontSize.md, weight: fontWeight.regular, lineHeight: 'normal', letterSpacing: '0' },
  listLabel: { size: fontSize.sm, weight: fontWeight.regular, lineHeight: 'normal', letterSpacing: '0' },
} as const
```

**Admin context override**: most admin surfaces live in `body` / `bodySm`; `display*` tokens exist for the rare oversized empty state, marketing-style auth screen, or onboarding hero. Keep them in the contract; use sparingly.

**Compact-list density rules** (Linear inbox-aligned — applies to every read-list view: posts / notes / pages / says / recently / comments / etc.)

- Use `listTitle` (13/500/normal/`ink`) for the row's primary text. It is the only text on a row that uses `medium` weight.
- Use `listMeta` (13/450/normal/`inkSubtle`) for everything else on the meta line — status, id, time, counts. Same metric as the title; only color differentiates it.
- `listLabel` (12/450/normal/`inkMuted`) is reserved for chip / pill bodies on coloured backgrounds.
- Never introduce a third list size. If you feel like you need 11 px or 14 px for a list element, change the **color** instead.
- Row height: `min-height: 57px` with `padding: 10px 16px` and `gap: 4px` between the title line and the meta line. This is the "B variant" used by `2026-05-10-posts-list-design.md`.
- Icon-in-text uses `iconSize.sm` (12). Row-start semantic icons use `iconSize.lg` (16). Right-of-row status / action glyphs use `iconSize.md` (14).

### spacing

Base unit 4 px, identical to DESIGN.md.

```ts
export const spacing = {
  xxs: '4px',
  xs:  '8px',
  sm:  '12px',
  md:  '16px',
  lg:  '24px',
  xl:  '32px',
  xxl: '48px',
  section: '96px',
} as const
```

### radius

```ts
export const radius = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  xxl: '24px',
  pill: '9999px',
  full: '9999px',
} as const
```

### elevation

DESIGN.md: depth via surface ladder + hairlines, not shadows. Encode as four named recipes referenced by primitives.

```ts
export const elevation = {
  // level 0 — flat on canvas
  flat: {
    background: color.canvas,
    border: 'none',
    boxShadow: 'none',
  },
  // level 1 — default card / panel
  raised: {
    background: color.surface1,
    border: `1px solid ${color.hairline}`,
    boxShadow: 'none',
  },
  // level 2 — featured / hovered card
  raisedStrong: {
    background: color.surface2,
    border: `1px solid ${color.hairlineStrong}`,
    boxShadow: 'none',
  },
  // level 3 — submenu / dropdown surface
  popover: {
    background: color.surface3,
    border: `1px solid ${color.hairline}`,
    boxShadow: 'none',
  },
  // focus ring
  focusRing: {
    outline: `2px solid ${color.primaryFocus}`,
    outlineOffset: '2px',
    outlineColor: 'rgba(94, 105, 209, 0.5)',  // primary-focus @ 50%
  },
} as const
```

### motion

`motion` is the runtime animation library. Tokens here only encode timing / easing constants reused across primitives.

```ts
export const motion = {
  duration: {
    instant: 0.08,
    fast: 0.16,
    normal: 0.22,
    slow: 0.32,
    enter: 0.24,
    exit: 0.18,
  },
  easing: {
    standard: [0.2, 0, 0, 1] as const,        // material standard
    decelerate: [0, 0, 0.2, 1] as const,
    accelerate: [0.4, 0, 1, 1] as const,
    overshoot: [0.34, 1.56, 0.64, 1] as const,
  },
} as const
```

These are plain TS values, **not** css.ts vars — they feed `motion`'s `transition={{ duration, ease }}` props. Animations that target CSS properties without `motion` should still use these durations via inline style so the system has one tempo.

### z-index

Single source for stacking order. Primitives must reference these — never magic numbers.

```ts
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  drawer: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
  kbar: 800,
} as const
```

---

## Theme contract

`vanilla-extract` `createThemeContract` defines the abstract slots; `createTheme` instantiates the dark theme and reserves the slot shape for a later light theme.

```ts
// src/styles/theme.css.ts
import { createGlobalTheme, createThemeContract, createTheme } from '@vanilla-extract/css'
import { color, typography, fontFamily, spacing, radius, elevation, zIndex } from './tokens'

export const themeContract = createThemeContract({
  color: { /* every key from `color` */ },
  fontFamily: { /* every key from `fontFamily` */ },
  spacing: { /* every key from `spacing` */ },
  radius: { /* every key from `radius` */ },
  zIndex: { /* every key from `zIndex` */ },
})

export const darkTheme = createTheme(themeContract, {
  color, fontFamily, spacing, radius, zIndex,
})

// reserved — empty for now
export const lightTheme = darkTheme  // intentional alias until 02b lands
```

**Why a contract**: the `themeContract` resolves to CSS variable names; consumers reference `themeContract.color.canvas` regardless of which theme is active. Switching themes swaps the class on `<html>`, no consumer rewrites.

**Typography is *not* in the contract** because the values are static across themes. They live as plain TS exports in `tokens/typography.ts` and ship as compile-time constants.

**Elevation and motion are *not* in the contract** because they're recipes / animation values, not single tokens.

---

## Theme switching

Source repo's behavior:

- `theme-mode` localStorage key holds `'light' | 'dark' | 'system'`.
- A boot script in `index.html` reads the key and toggles `<html class="dark">` before React mounts (anti-flash).
- `useUIStore` (Zustand in new repo) owns `themeMode` reactively at runtime.

New repo retains all three behaviors. Until `lightTheme` is implemented, the boot script and store still toggle the class, but only `darkTheme` is bound to `:root.dark`. The light branch falls back to dark — visible as identical surface, but the wiring is correct so 02b drops in cleanly.

```css
/* generated by vanilla-extract */
:root           { /* dark vars (default) */ }
:root.dark      { /* dark vars (explicit) */ }
:root.light     { /* light vars — empty until 02b */ }
```

Implementation:

```ts
// src/styles/theme.css.ts (continued)
export const globalStyles = createGlobalTheme(':root, :root.dark', themeContract, { /*...*/ })
// :root.light wired in 02b
```

`useUIStore` in spec 04 owns:

- `themeMode: 'light' | 'dark' | 'system'`
- `isDark: boolean` (derived)
- `setThemeMode(mode)`
- side-effect: writes `theme-mode` to localStorage and toggles `document.documentElement.className`

---

## Recipe conventions

Primitives in spec 03 declare recipes via `@vanilla-extract/recipes`. The contract:

1. **Name the recipe after the component.** `buttonRecipe`, not `btn` or `cta`.
2. **Variants are flat objects of mutually-exclusive options.** Booleans live under `defaultVariants` and toggle a single class.
3. **Compound variants are last-resort.** Prefer composing two clean variants over one compound.
4. **No `style({})` calls outside recipes** for primitives — recipes give predictable class trees and tree-shake cleanly. Layout / app-level styles may use plain `style`.

Sample shape (Button — full version in spec 03):

```ts
import { recipe } from '@vanilla-extract/recipes'
import { themeContract } from '~/styles/theme.css'

export const buttonRecipe = recipe({
  base: {
    fontFamily: themeContract.fontFamily.text,
    borderRadius: themeContract.radius.md,
    paddingBlock: '8px',
    paddingInline: '14px',
    /* ... */
  },
  variants: {
    intent: {
      primary: { background: themeContract.color.primary, color: themeContract.color.onPrimary },
      secondary: { background: themeContract.color.surface1, color: themeContract.color.ink, border: `1px solid ${themeContract.color.hairline}` },
      tertiary: { background: 'transparent', color: themeContract.color.ink },
      inverse: { background: themeContract.color.inverseCanvas, color: themeContract.color.inverseInk },
    },
    size: {
      sm: { /* compact pill */ },
      md: { /* default */ },
      lg: { /* hero */ },
    },
    state: {
      disabled: { opacity: 0.4, pointerEvents: 'none' },
    },
  },
  defaultVariants: { intent: 'secondary', size: 'md' },
})
```

---

## DESIGN.md handling

The full DESIGN.md the user supplied lives at the repo root. It is the human-readable design source and **must not** be edited to reflect implementation choices — when implementation diverges (e.g. surface ladder hex calibration, admin-only semantic colors), the divergence lives in this spec instead. DESIGN.md stays canonical.

A short header at the top of DESIGN.md will state:

> Implementation token mappings live in `src/styles/tokens/*.ts`. Admin-specific extensions and any divergence from this document are tracked in `docs/superpowers/specs/2026-05-06-react-migration/02-design-tokens.md`.

---

## Acceptance for spec 02

1. `pnpm typecheck` passes with `theme.css.ts` exporting a `themeContract`, `darkTheme`, and a placeholder `lightTheme` alias.
2. A demo `app.tsx` renders three swatches (canvas, primary, ink) using `themeContract.color.*` and renders correctly under both `<html class="dark">` and no class.
3. The boot script in `index.html` toggles `<html class="dark">` before React mounts (`theme-mode` localStorage round-trip works).
4. `body` font is Inter at 16px / weight 400 — verified by computed style.
5. All token namespaces (color, typography, fontFamily, spacing, radius, elevation, motion, zIndex) export from `~/styles/tokens` and are documented in `src/styles/README.md`.
6. **No primitive components ship in 02.** That's spec 03's job.

---

## Open questions

- ~~**Surface ladder calibration**~~ — resolved in v1 calibration pass below (2026-05-10).
- **Light theme priority**: defer to 02b. Decide post-P1 whether light theme is part of v1 cutover or a follow-up.
- **Charts theme**: `@antv/g2` and CodeMirror One Dark have their own theme APIs. Spec 09/10 own the bridge from `themeContract.color.*` into those libraries.

---

## v1 calibrated · 2026-05-10

Calibration pass per spec §7 of [`2026-05-09-p1-layout-shell-design.md`](../2026-05-09-p1-layout-shell-design.md). Targets: color surface ladder + hairlines + canvas + active-nav background. Spacing / typography / radius / motion / zIndex unchanged.

### color · before / after

| Token | v0 | v1 | Rationale |
|---|---|---|---|
| `canvas` | `#010102` | `#08090b` | 纯黑过死，与 surface1 之差不可辨；微提亮且偏蓝调以拟 Linear 之深底；保 canvas → surface1 之 step。 |
| `surface1` | `#0f1011` | `#101113` | 微调 hue，使 5-lightness step 更匀；Card / panel 默认底。 |
| `surface2` | `#181a1c` | `#171a1d` | 与 surface1 之差更线性；hover / faint elevation。 |
| `surface3` | `#1f2124` | `#1f2226` | popover / dropdown / 强 hover；保留较显著之提升。 |
| `surface4` | `#26282b` | `#272b30` | 顶层 chip / floating popover；微调 hue 与 step。 |
| `hairline` | `#23252a` | `#23262b` | 标准分隔线；hue 微调贴 surface 序列。 |
| `hairlineStrong` | `#2f3137` | `#2f3239` | 强调分隔，重 emphasis 时用。 |
| `hairlineTertiary` | `#1a1c20` | `#181b1f` | 轻分隔（如卡内分组），原值过亮。 |
| `primary / primaryHover / primaryFocus` | `#5e6ad2 / #828fff / #5e69d1` | unchanged | Linear brand 精确值，不动。 |

### sidebar 之 active 项背景

非 token，乃局部静态值，置于 `src/layouts/AppShell/Sidebar.css.ts`：

| | v0 | v1 | Rationale |
|---|---|---|---|
| `itemRecipe.variants.active.true.background` | `themeContract.color.surface3` | `'#1a1c20'` | 旧值过亮喧宾，新值居 surface2 与 surface3 之间，与 sidebar 底色协而不杂。spec §7 «out of scope: 静态值可解者勿污 contract»，故不入 token。 |

### 不动者

- `spacing` · `radius` · `zIndex` · `typography` · `fontFamily` · `motion` · `elevation` ：v0 即定，无变。
- `chrome` 维度 token：在 P1 layout shell 落地时已就位（`src/styles/tokens/chrome.ts`），非本次 v1 calibration 之新增。
- 测试无依赖 hex 值者，`pnpm test` 仍绿。

### 影响

- `:root, :root.dark` 之 CSS 变量值随之而变；所有引用 `themeContract.color.*` 之处自动生效。
- `src/styles/tokens/elevation.ts` 之 recipe 仍引用 `themeContract`，故 elevation 表象随 surface 序列同步刷新。
- 一处静态 hex（active nav）外，无其他直引值。

---

## v2 calibrated · 2026-05-11

Typography pass triggered by Linear inbox-row anatomy: visual hierarchy in compact lists must come from **weight + color**, not size. Posts-list v1 first surfaced the gap (rows felt crowded, 14/500 title vs 12/400 meta read as two competing weights). Source: live-fetched computed styles from `linear.app/lobehub/reviews` of the "Ready to merge" list. Only typography & icon-size tokens shift — color / spacing / radius / motion / zIndex unchanged.

### Linear's measured row anatomy (sample row #14597)

| Element | size | weight | line-height | letter-spacing | color |
|---|---|---|---|---|---|
| Title | 13px | 500 | normal (≈15.6) | normal | `lch(100 0 272)` (≈ ink) |
| Status / id / time | 13px | 450 | normal | normal | `lch(61.4 1.15 272)` (≈ inkSubtle) |
| Branch / chip label | 12px | 450 | normal (≈14.4) | normal | `lch(90.35 1.15 272)` (≈ inkMuted) |
| Row icon (start) | 16 × 16 | — | — | — | `currentColor` |
| Inline meta icon | 12 × 12 | — | — | — | `currentColor` |
| Right-side status / action | 14 × 14 | — | — | — | `currentColor` |

Row container: 889 × **57** px, `padding: 0` outer, `2px 0` wrapper, two text lines centered with ~12 px between baselines. `font-family: 'Inter Variable', 'SF Pro Display', system-ui, …`.

### token additions · before / after

| Symbol | v1 | v2 | Rationale |
|---|---|---|---|
| `fontFamily.text / display` | `'Inter', 'SF Pro …'` | `'Inter Variable', 'Inter', 'SF Pro …'` | 加 Inter Variable 首位，俾 weight 450 真生效；无变体字体之机退至 'Inter' 静体（450 → 400 之舍入）。 |
| `fontSize` | （无原子轴） | `xs:11 / sm:12 / md:13 / base:14 / lg:16` | Linear 之轴只 13/12 二档，但 admin 偶有 11/14/16 之需（pane title / button / right-pane title），故全表立。 |
| `fontWeight` | （无原子轴） | `regular:450 / medium:500 / semibold:600` | Linear inbox 实测之 450 而非 400，俾 meta line 较 caption 更厚；title 之 500 与之差 50，正好成轻重对比而不喧。 |
| `iconSize` | （无原子轴） | `lg:16 / md:14 / sm:12` | Linear 三档：行首语义 16，次级状态 14，inline-with-text 12。无 18/20 — 大于 16 之图标当回到 components 自决。 |
| `typography.listTitle` | （未存） | `13/500/normal/0` | 行标，唯一之 medium-weight 元素。 |
| `typography.listMeta` | （未存） | `13/450/normal/0` | 状态 / id / time / counts 之同一规格，仅以色分级。 |
| `typography.listLabel` | （未存） | `12/450/normal/0` | chip / pill 之内文，inkMuted 色以平衡彩底。 |

### compact-list 密度之规

不再以「每个列表自定 size」而以 token 表所记。posts list / notes list / pages list / says / recently / comments — 凡 read-list 之视，皆遵：

- 行 `min-height: 57px`，padding `10px 16px`，title↔meta 行间 `gap: 4px`。
- 标题 = `typography.listTitle`，唯一 medium。
- 元数据 = `typography.listMeta`，唯色分级（`inkSubtle` / `inkMuted` / `inkTertiary`）。
- 不引第三号字。如须变化，换色，毋换号。
- icon 三档严守 `iconSize.{lg|md|sm}`。

### 不动者

- `color` · `spacing` · `radius` · `zIndex` · `motion` · `elevation` · `chrome` ：v1 即定，无变。
- 既有 `typography.{displayXl..mono}` preset 全保留 — 仅追新者 `listTitle / listMeta / listLabel` 与原子轴；既有引用之处不动。
- `body` 全局之 16px / 400 / 1.5 不变（global.css.ts 仍引 `typography.body`）。

### 影响

- `src/pages/posts/view/PostsView.css.ts` 之 row / meta / time / category 全改用 `typography.list*` + `themeContract.color.*`，row 高 56 → **57**。
- `src/pages/posts/view/list/Row.tsx` 之 `lucide` icon size 11 → `iconSize.sm`(12)。
- 后续 list views（spec 11 batch 3a 之 notes / pages / says / recently）必直引此处 token，毋再于 view 内立私规模。
- 既有非 list 视面（dashboard / setup / login / 表单）之 typography preset 不动，故无视觉回归。
- `pnpm typecheck` + `oxlint` + 122 vitest 皆绿（2026-05-11）。
