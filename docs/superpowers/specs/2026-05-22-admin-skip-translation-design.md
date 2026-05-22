# Admin: Skip Implicit Translation in API Requests

**Date:** 2026-05-22
**Status:** Approved (pending implementation plan)
**Scope:** `admin-vue3` (frontend) + `mx-core` (backend)

## Problem

The admin dashboard (`admin-vue3`) loads content the user is *editing* or *managing*. When a post has been translated (e.g., zh → en), the backend currently honors the browser's implicit `Accept-Language: zh-CN` header and returns the translated body in place of the original. The version-diff dialog (see screenshot of `/posts/edit?id=...`) shows the translated content as the "old" baseline, which is misleading: the editor must always operate on the original record.

Root cause: `RequestContextMiddleware` (`mx-core/apps/core/src/common/middlewares/request-context.middleware.ts`) resolves the request language from four sources in priority order:

1. `x-lang` header
2. `NEXT_LOCALE` cookie
3. `Accept-Language` header
4. `undefined`

Admin never sets `x-lang` and has no `NEXT_LOCALE` cookie, so requests fall through to `Accept-Language` (set automatically by the browser). Downstream translation logic (post hydration, enrichment hydration via `RequestContext.currentLang()`) then substitutes the translated record.

## Audit: No Admin API Consumes Translated Payloads

A scan of `apps/admin/src/api/*.ts` shows lang/locale references appear only in three files, all of which use lang as a **business parameter** (not as a "render this response in lang X" signal):

| File | Purpose | lang role |
|---|---|---|
| `ai.ts` | CRUD on AI translation entries | data field of the translation record itself |
| `enrichment.ts` | List/refresh/invalidate per-locale enrichment cache rows | filter dimension for cache-row selection |
| `search-index.ts` | Per-language search index management | filter dimension for index selection |

All three pass lang via query string or request body. **No admin endpoint relies on automatic translation of the response body.** Therefore admin can safely opt out of implicit translation globally.

## Design

### Semantics of `x-skip-translation: 1`

Admin asserts on every outbound request: "ignore implicit locale signals; honor only explicit ones."

| Source | When skip is on | When skip is off (current behavior) |
|---|---|---|
| `?lang=xx` query | **respected** (via existing `@Lang()` decorator) | respected |
| `x-lang` header | **respected** | respected |
| `NEXT_LOCALE` cookie | **ignored** | respected |
| `Accept-Language` header | **ignored** | respected |

Rationale: skip-translation guards against the *implicit* leak from the browser environment (Accept-Language, cross-origin cookie). Explicit signals (`?lang=` or `x-lang:`) remain valid business intent — admin's `enrichment.refresh(..., locale='zh')` still passes `?lang=zh` to filter the correct cache row.

### Frontend (admin-vue3)

#### F1 — `apps/admin/src/utils/request.ts`

Inject the header unconditionally in the shared ofetch instance's `onRequest` hook. Covers all `request.{get, post, put, patch, delete}` calls.

```ts
onRequest({ options }) {
  const headers = new Headers(options.headers)
  headers.set('x-uuid', _uuid)
  headers.set('x-skip-translation', '1')
  // ...rest unchanged
}
```

#### F2 — `apps/admin/src/components/editor/rich/agent-chat/composables/use-agent-loop.ts:47`

The agent-chat SSE stream uses raw `fetch()`, bypassing the shared instance. Add the header to its `headers` literal.

```ts
const response = await fetch(`${API_URL}/ai/agent/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-skip-translation': '1',
  },
  credentials: 'include',
  body: JSON.stringify({ model, messages, tools, providerId }),
  signal,
})
```

Other raw `fetch()` usages in admin (`github-repo.ts`, `hitokoto.ts`) target external services and are out of scope.

### Backend (mx-core)

#### B1 — `apps/core/src/common/middlewares/request-context.middleware.ts`

Adjust the lang-resolution chain. When `x-skip-translation: 1`, restrict the chain to `x-lang` only. No new fields on `RequestContext`. No change to `@Lang()` decorator.

```ts
use(req: BizIncomingMessage, res: ServerResponse, next: () => any) {
  const requestContext = new RequestContext(req, res)

  const skip = req.headers['x-skip-translation'] === '1'
  const headerLang = req.headers['x-lang']
  const fromHeader =
    typeof headerLang === 'string'
      ? normalizeLanguageCode(headerLang)
      : undefined

  requestContext.lang = skip
    ? fromHeader
    : fromHeader ||
      parseCookieLocale(req.headers.cookie) ||
      parseAcceptLanguage(req.headers['accept-language']) ||
      undefined

  RequestContext.run(requestContext, () => next())
}
```

#### B2 — `@Lang()` decorator: unchanged

`apps/core/src/common/decorators/lang.decorator.ts` is not modified. Its existing query-precedence logic (and ctxStore writeback) continues to apply uniformly. When admin sends `?lang=zh` to e.g. `/enrichment/admin/refresh/...?lang=zh`, the decorator resolves `'zh'`, returns it to the controller, and writes `'zh'` to `ctxStore.lang` — which is the expected behavior for an explicit, scoped business request.

## Verification

### Backend unit tests

`apps/core/src/common/middlewares/request-context.middleware.spec.ts` (or equivalent):

- `x-skip-translation: 1` + `Accept-Language: zh-CN` → `ctxStore.lang === undefined`
- `x-skip-translation: 1` + `x-lang: ja` → `ctxStore.lang === 'ja'`
- `x-skip-translation: 1` + cookie `NEXT_LOCALE=fr` → `ctxStore.lang === undefined`
- No `x-skip-translation` + `Accept-Language: zh-CN` → `ctxStore.lang === 'zh'` (regression guard for non-admin callers)

### Backend integration smoke

A controller that translates based on `RequestContext.currentLang()` (e.g., post detail with hydrated enrichments): request with `x-skip-translation: 1` returns original payload regardless of `Accept-Language`.

### Frontend manual verification

1. Open admin `/posts/edit?id=...` for a post with translations. Confirm both the editor body and the version-diff dialog show the original (untranslated) text.
2. Open the enrichment admin panel, filter by `locale='zh'`. Confirm only zh cache rows render — i.e., explicit `?lang=zh` still works.
3. Run an AI agent-chat session. Confirm the SSE stream still functions (no regression from the header addition).
4. Network tab: every request to the admin backend carries `x-skip-translation: 1`.

### Compatibility

- Yohaku / Shiroi and other public callers do not send `x-skip-translation`. Their language resolution chain is unchanged.
- `?lang=original` (existing escape hatch via `@Lang()` decorator) continues to work for ad-hoc opt-out by other callers.

## Out of Scope

- Refactoring `RequestContext.lang` into a richer locale object (no demand)
- Adding a `bypassTransform`-style per-request opt-in/opt-out on the admin side (global opt-out is sufficient given the audit)
- Backend-side audit of which admin controllers do or do not have `@Lang()` (orthogonal — the middleware change is sufficient because `@Lang()` only fires when a controller opts in)

## Risks

- **External callers that piggyback on the admin origin** (none today) could be surprised by the global header. Mitigation: the header is set only inside admin-vue3's request utility; not exported, not on `window`.
- **Future admin endpoint that *does* want browser-locale-based translation**: would have to opt back in per-call. Considered acceptable: such a case has not arisen and admin's purpose is to manage records, not consume rendered translations.

## Files Touched

Frontend:
- `apps/admin/src/utils/request.ts`
- `apps/admin/src/components/editor/rich/agent-chat/composables/use-agent-loop.ts`

Backend:
- `mx-core/apps/core/src/common/middlewares/request-context.middleware.ts`
- `mx-core/apps/core/src/common/middlewares/request-context.middleware.spec.ts` (new or extended)
