# 10 · Charts & Miscellaneous

**Date**: 2026-05-06
**Owner spec**: [00-roadmap.md](./00-roadmap.md)
**Phase**: P1 (G2 hook + kbar) → P3 (markdown / diff / shiki land progressively)
**Depends on**: 03 (Card, Modal), 04 (UI store theme), 06 (route names for kbar actions)
**Feeds**: 11 (dashboard / analyze / drafts / markdown views)

Catches the residual integrations: AntV G2 charts, kbar command palette, shiki / marked / katex, `@pierre/diffs`, excalidraw outside haklex, canvas-confetti.

---

## Scope

- **In**: `useG2Chart` hook, kbar setup + actions, shiki async highlighter, marked + katex rendering pipeline, `<DiffPreview>` wrapper, excalidraw standalone usage, confetti utility.
- **Out**: charts inside views (composition lives in 11), markdown editing extensions (CM6 — see 09).

---

## Charts (recharts)

> **Status 2026-05-10 — superseded.** AntV G2 dropped from the dependency tree; **recharts** is the canonical chart library. Composable React components, no imperative `useG2Chart` hook needed. The G2 spec text below is preserved as design history; the `useG2Chart` hook is no longer planned. Acceptance items 1 and 3 referencing G2 are dropped.

### Recharts pattern

```tsx
// src/pages/dashboard/index.tsx (current shipping shape)
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const TrendChart = () => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={mockSeries} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
      <Area type="monotone" dataKey="visits" stroke="#5e6ad2" strokeWidth={2} />
      …axes, grid, tooltip wired with token-driven colors…
    </AreaChart>
  </ResponsiveContainer>
)
```

Tone: hard-code colors against `themeContract` token literals at the recharts layer (recharts wants raw color strings, not CSS vars). Accept the duplication; charts are few.

### Theme bridging

Recharts is light/dark-agnostic — pass colors per chart instance. Pull from `themeContract` exports; do not introduce a separate chart palette.

### Below — original G2 design (historical)

### Hook

```tsx
// src/hooks/useG2Chart.ts
import { Chart, type ChartCfg } from '@antv/g2'
import { useEffect, useRef } from 'react'

export interface UseG2ChartArgs {
  spec: (chart: Chart) => void
  data: unknown[]
  theme?: 'classic' | 'classicDark'
  // additional ChartCfg fields if needed
}

export function useG2Chart({ spec, data, theme = 'classicDark' }: UseG2ChartArgs) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      theme,
    })
    chartRef.current = chart
    spec(chart)
    chart.data(data)
    chart.render()

    return () => { chart.destroy(); chartRef.current = null }
  }, [])

  // re-render on data change
  useEffect(() => {
    chartRef.current?.changeData(data)
  }, [data])

  // theme switch
  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.theme(theme)
    chartRef.current.render()
  }, [theme])

  return { containerRef, chartRef }
}
```

### Chart components

Each chart from source `src/views/dashboard/components/` ports to a function component:

```tsx
// src/components/chart/CategoryPie.tsx
export function CategoryPie({ data }: { data: CategoryDatum[] }) {
  const isDark = useUIStore((s) => s.isDark)
  const { containerRef } = useG2Chart({
    spec: (chart) => {
      chart.coordinate({ type: 'theta', innerRadius: 0.55 })
      chart.interval()
        .encode('x', 'name')
        .encode('y', 'count')
        .encode('color', 'name')
        .scale('color', { palette: 'tableau10' })
        .style({ stroke: 'transparent' })
        .label({ text: 'name', position: 'outside' })
    },
    data,
    theme: isDark ? 'classicDark' : 'classic',
  })

  return <div ref={containerRef} className={styles.chart} />
}
```

Other chart components (`PublicationTrend`, `TrafficSource`, `CommentActivity`, `TagCloud`, `AnalyzeData`) follow the same pattern with their own `spec` callbacks.

### Theme bridging

G2 ships `'classic'` and `'classicDark'` themes. They use AntV's color palette, not Linear's. Acceptable trade-off for P1/P3; revisit in P5 to override accent colors via `chart.theme({ category10: [...] })`.

---

## kbar (command palette)

### Setup

```tsx
// src/components/kbar/KBarRoot.tsx
import { KBarProvider, KBarPortal, KBarPositioner, KBarAnimator, KBarSearch, KBarResults, useMatches, type Action } from 'kbar'
import { useNavigate } from 'react-router'

export function KBarRoot({ children }: { children: ReactNode }) {
  const actions = useKbarActions()
  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner className={styles.positioner}>
          <KBarAnimator className={styles.animator}>
            <KBarSearch className={styles.search} placeholder="Search… (⌘K)" />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  )
}
```

`KBarRoot` wraps the entire authed app (mounted in `AppShell`).

### Actions

```ts
// src/components/kbar/useKbarActions.ts
export function useKbarActions(): Action[] {
  const navigate = useNavigate()
  const setThemeMode = useUIStore((s) => s.setThemeMode)
  const logout = useLogout()

  return useMemo(() => [
    // route navigation actions — generated from navItems (spec 07)
    ...navItems.flatMap((g) =>
      g.kind === 'group'
        ? g.children.map((c) => ({
            id: `nav.${c.to}`,
            name: c.label,
            section: g.label,
            keywords: c.label,
            perform: () => navigate(c.to),
          }))
        : [{
            id: `nav.${g.to}`,
            name: g.label,
            section: '导航',
            perform: () => navigate(g.to),
          }]
    ),
    // app actions
    { id: 'theme.dark', name: '切换至深色', section: '外观', perform: () => setThemeMode('dark') },
    { id: 'theme.light', name: '切换至浅色', section: '外观', perform: () => setThemeMode('light') },
    { id: 'theme.system', name: '跟随系统', section: '外观', perform: () => setThemeMode('system') },
    { id: 'logout', name: '退出登录', section: '账户', perform: () => logout() },
  ], [navigate, setThemeMode, logout])
}
```

Per-view ad-hoc actions can register through `useRegisterActions(actions)` inside a page component — same as source.

### Trigger

`<KBarTrigger />` (in Header, spec 07) calls `useKBar().query.toggle()` on click. Global shortcut `⌘K` / `Ctrl+K` handled by kbar internally.

### Styling

Match Linear popover style: surface-3, hairline border, radius `lg`. Results highlight uses `surface-2`. css.ts file `src/components/kbar/kbar.css.ts` owns all styles.

---

## shiki

Async syntax highlighting for read-only code blocks (markdown rendering, snippet preview, draft preview).

```ts
// src/lib/shiki.ts
import { createHighlighter, type Highlighter } from 'shiki'

let highlighter: Highlighter | null = null

export async function getHighlighter() {
  if (highlighter) return highlighter
  highlighter = await createHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: ['typescript', 'tsx', 'javascript', 'json', 'bash', 'yaml', 'markdown', 'css', 'html', 'sql'],
  })
  return highlighter
}

export async function highlight(code: string, lang: string, isDark: boolean) {
  const h = await getHighlighter()
  return h.codeToHtml(code, { lang, theme: isDark ? 'github-dark' : 'github-light' })
}
```

### React component

```tsx
// src/components/markdown/CodeBlock.tsx
export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const isDark = useUIStore((s) => s.isDark)
  const [html, setHtml] = useState<string>('')
  useEffect(() => {
    let alive = true
    highlight(code, lang, isDark).then((h) => { if (alive) setHtml(h) })
    return () => { alive = false }
  }, [code, lang, isDark])
  return <div className={styles.code} dangerouslySetInnerHTML={{ __html: html }} />
}
```

`dangerouslySetInnerHTML` is acceptable — shiki output is sanitized.

---

## marked + katex (markdown rendering)

```ts
// src/lib/markdown.ts
import { marked } from 'marked'
import katex from 'katex'

const renderer = new marked.Renderer()
renderer.code = (code, lang) => {
  // delegate to <CodeBlock />? no — marked is sync; emit a marker and let React replace
  return `<pre data-lang="${lang ?? 'text'}"><code>${escapeHtml(code)}</code></pre>`
}
// math, image, link customizations …

export function renderMarkdown(input: string): string {
  return marked.parse(input, { renderer, async: false }) as string
}
```

Component:

```tsx
// src/components/markdown/MarkdownRender.tsx
export function MarkdownRender({ source }: { source: string }) {
  const html = useMemo(() => renderMarkdown(source), [source])
  // post-process: find <pre data-lang> blocks and swap with <CodeBlock>; or render via React component
  return <div className={styles.markdown} dangerouslySetInnerHTML={{ __html: html }} />
}
```

If shiki integration into marked output is desired, a richer pipeline parses the HTML and replaces code blocks with React `<CodeBlock>` nodes. Decide during P3 — for first land, server-emitted markdown is rare in admin (mostly comments + descriptions).

KaTeX renders inline math `$ ... $` and block `$$ ... $$` via a custom marked extension. Port the existing extension from source unchanged.

---

## `@pierre/diffs`

```tsx
// src/components/draft/DiffPreview.tsx
import { FileDiff } from '@pierre/diffs'
import { useEffect, useRef } from 'react'

export function DiffPreview({ oldContent, newContent, language = 'markdown' }: DiffPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!containerRef.current) return
    const diff = new FileDiff()
    diff.render(
      { name: 'before', content: oldContent, language },
      { name: 'after', content: newContent, language },
      containerRef.current
    )
    return () => { containerRef.current && (containerRef.current.innerHTML = '') }
  }, [oldContent, newContent, language])

  return <div ref={containerRef} className={styles.diff} />
}
```

Used in draft history view. The library is framework-agnostic; just port the lifecycle.

For larger jsondiffpatch usage in `/setting` value diffs, use `jsondiffpatch.formatters.html.format(delta, left)` directly — no React integration needed.

---

## excalidraw (standalone)

`@excalidraw/excalidraw` is React-native. Standalone use (outside the haklex inline plugin) renders directly:

```tsx
import { Excalidraw } from '@excalidraw/excalidraw'
<Excalidraw theme={isDark ? 'dark' : 'light'} initialData={{ elements }} />
```

Currently no admin view consumes excalidraw standalone outside haklex. If a need emerges, this section is the contract.

---

## canvas-confetti

Trivial port:

```ts
// src/utils/confetti.ts
import confetti from 'canvas-confetti'

export function showConfetti() {
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } })
}
```

Used after successful publish in write views or after setup completion.

---

## ansi_up

Source repo uses `ansi_up` to convert ANSI escape sequences to HTML for log output rendering (snippet logs, cron logs).

```ts
// src/lib/ansi.ts
import AnsiUp from 'ansi_up'

const ansi = new AnsiUp()
ansi.use_classes = true   // emit classes, style via css.ts

export function ansiToHtml(input: string): string {
  return ansi.ansi_to_html(input)
}
```

`<LogView>` component (used by snippet log drawer, cron view) renders pre-formatted output via `dangerouslySetInnerHTML`.

---

## Acceptance for spec 10

### P1 acceptance

1. `useG2Chart` mounts a chart and renders one P1 visual (the dashboard's `CategoryPie` or `PublicationTrend`).
2. `KBarRoot` wraps `AppShell`; `⌘K` opens the palette; navigating via the palette routes correctly.
3. Theme switch flips both G2 chart theme and kbar's surface tokens.

### P3 acceptance

1. `<CodeBlock>` renders shiki-highlighted code; theme switch re-highlights.
2. `<MarkdownRender>` renders sample markdown including code, math, and links per source's renderer customizations.
3. `<DiffPreview>` renders a sample diff between two markdown strings.
4. `ansiToHtml` renders sample ANSI log output with proper class styling.
5. `showConfetti()` works.

---

## Open questions

- **G2 v5 API stability.** Source pins `^5.4.8`; verify spec works against latest 5.x during port.
- **kbar styling polish.** Current kbar styling defaults are mid-tier; budget time in P5 for visual polish on the palette.
- **shiki bundle size.** `createHighlighter` with many langs balloons bundle size. Default langs list above is conservative; expand on demand.
- **Marked + shiki integration.** Two paths: (a) post-process HTML to swap code blocks with React, (b) parse markdown into a token tree and render in JSX. (a) is faster; (b) is cleaner. Pick during P3 implementation based on whether token-level customizations are needed.
