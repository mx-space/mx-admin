# Data Flow Redesign · Zustand-canonical store with race-safe injection

**Date**: 2026-05-10
**Status**: design (pending implementation)
**Supersedes**: portions of [05-data-layer.md](./2026-05-06-react-migration/05-data-layer.md) regarding cache-as-state, mutation invalidation, and socket→cache wiring.
**Touches**: [04-state-layer.md](./2026-05-06-react-migration/04-state-layer.md) (adds a `useDataStore` not previously specified), [11-views-migration.md](./2026-05-06-react-migration/11-views-migration.md) (every per-view query hook flows through this engine).

A normalized client-side data layer for `mx-admin-next`. Zustand becomes the canonical store for all server-derived data; TanStack Query is demoted to a fetch orchestrator (request dedup, retry, signal abort, loading/error). All mutations route through a generic engine that performs optimistic patches, server-feedback single-row injection, and explicit race control. The design is local-first **in shape only** — no IndexedDB, no offline mutation queue, no replication. Server remains authoritative.

This revision incorporates a Codex review pass dated 2026-05-10; see Changelog.

---

## Motivation

Two pain points drive the redesign:

1. **Minimum-fetch on data change.** Spec 05's default mutation pattern calls `queryClient.invalidateQueries(...)`, which triggers a full list refetch. Mutating one entity should patch one row in the store — not re-pull the entire list response.
2. **Optimistic updates as the default.** UI should reflect user intent immediately; on success, the server's response payload is the canonical replacement for the optimistically-patched row. On failure, rollback. This pattern is mentioned in spec 05 only as "reserved for high-frequency UX (comment status updates)"; the new design promotes it to the default `useUpdate` behavior.

A third concern emerged during brainstorming and is treated as first-class:

3. **Race control.** Multiple in-flight requests, mutations crossing list refetches, out-of-order socket events, and stale optimistic rollbacks must not corrupt store state. The engine carries an explicit defense for each scenario.

---

## Scope

- **In**: single Zustand store (`useDataStore`) with one normalized slice per resource; `createResourceTable` engine that produces hooks (`useList`, `useEntity`, `useCreate`, `useUpdate`, `useDelete`) and imperative actions (`injectEntity`, `removeEntity`, `invalidateList`); race-safe inject paths driven from inside `queryFn` / `mutationFn` (not the removed v5 `onSuccess` hooks); a command-queue model for optimistic mutations that survives interleaved success/failure; a universal entity-version guard for cross-source `byId` writes; socket bridge rewrite to use engine actions; pilot resources (`posts`, `comments`, `categories`); a `createSingletonResource` companion for resources without an `id` (e.g. `appInfo`); migration plan for the remaining resources.
- **Out**: offline support, IndexedDB persistence (only `ai` slice persists via `zustand/middleware/persist`), CRDT/conflict resolution, multi-tab sync, optimistic CREATE / DELETE (CREATE / DELETE remain server-completion + targeted list refetch), full-text search or client-side query languages, replacing TanStack Query as a dependency.

---

## Decisions

- **Zustand is the canonical store for server data.** Components read from `useDataStore`; they never read `useQuery().data`. Spec 05's stance ("pure server data does not warrant a store") is reversed for this layer.
- **One Zustand instance, many slices.** All resource tables live in one `useDataStore` keyed by resource name. Devtools see a single timeline; persistence has a single config; cross-table relations require no cross-store coordination.
- **TanStack Query stays.** Demoted role: in-flight tracking, signal-based abort on key change, retry policy, `isPending` / `error` state, refetch-on-mount/focus orchestration. Its cache is incidental — the engine never reads from it.
- **Inject inside `queryFn` / `mutationFn`.** TanStack Query v5 removed query-level `onSuccess` / `onError` callbacks. The engine performs store mutations inside the async fetcher itself (after `await`, before `return`), keeping inject and fetch in one critical section. Mutation hooks still use `useMutation`'s `onMutate` / `onSuccess` / `onError` (those callbacks remain in v5).
- **Local-first in shape only.** Schema mirrors backend tables and FK relations. No persistence beyond the existing `ai` slice carve-out. No mutation queue, no replication.
- **CRUD is divided.** `UPDATE` is optimistic **by default** (opt out with `useUpdate({ optimistic: false })`) and produces a single-row store injection on success. `CREATE` / `DELETE` mutations complete server-side, then patch byId and refetch the affected list(s) — no optimistic insertion.
- **Sort-key-aware UPDATE.** `UPDATE` defaults to "patch byId, leave list `ids[]` alone". A resource declares `listInvalidationFields: (keyof T)[]`; if a mutation's patch touches any of those keys, the engine marks every list of this resource stale **and** calls `queryClient.invalidateQueries({ queryKey: ['data', name, 'list'] })` so any mounted list re-runs its `queryFn` immediately. Unmounted lists pick up the staleness on next mount via `refetchOnMount`. This addresses the pilot's `posts.pinned` case.
- **Optimistic mutations use a command queue, not a single pending slot.** Per-id ordered stack of in-flight ops; success/error rebuilds `byId[id]` from the last-known server state plus remaining queued patches. Avoids the "M1 success arrives after M2 failure" data loss case.
- **Universal entity-version guard.** Every cross-source `byId` write (list response, detail response, mutation response, socket inject) compares `incoming[versionKey]` with the current server-known version; older or equal is dropped. Resources without `versionKey` fall back to a deterministic source-preference order (see *Cross-source ordering for non-versioned resources*).
- **Tombstones for deletes.** A resource keeps `tombstones: Record<id, deletedAt>` for ids deleted within the last `TOMBSTONE_TTL` (default 30s). All inject paths consult tombstones; a write whose entity id is tombstoned is dropped. Tombstones are pruned on TTL expiry and on successful re-create with the same id.
- **Generic engine over hand-rolled slices, with a singleton companion.** `createResourceTable<T, ...>` covers list+detail+CRUD resources (entity primary key configured via `cfg.pk`, default `'id'`); `createSingletonResource<T>` covers `appInfo`-style endpoints with no id and no list.
- **Race control is explicit, not implicit.** Per-entity command queue, per-listKey fetch sequences, per-id detail-fetch sequences, version stamps for cross-source writes, and a pending-op set guard every state mutation. Defenses are listed and individually testable.

---

## Architecture

```
┌─── UI components ───────────────────────────────────────────┐
│   posts.useList({ page })          posts.useEntity(id)       │
│   posts.useUpdate({ optimistic })  posts.useCreate()         │
└──────────┬─────────────────────────────────────────┬─────────┘
           │ read (selector + useShallow)             │ trigger (mutate)
           │                                          │
┌──────────▼──────────────────────────────────────────▼────────┐
│  useDataStore (single Zustand instance)                       │
│    posts:    ResourceState<PostModel>                         │
│    notes:    ResourceState<NoteModel>                         │
│    comments: ResourceState<CommentModel>                      │
│    appInfo:  SingletonState<AppInfoModel>                     │
│    ... × N resources                                          │
└──────────▲──────────────────────────────────────────┬────────┘
           │ inject (race-guarded, inside queryFn)     │ trigger fetch
           │                                           │
┌──────────┴──────────────────────────────────────────▼────────┐
│  TanStack Query (fetch orchestrator only)                     │
│    queryFn(signal) → request → inject(state) → return         │
│    mutationFn → request → onSuccess(server) → inject          │
│    isPending / error / refetch                                │
└──────────────────────────────────────────────────────────────┘
                       │
                  REST (ofetch) / Socket (socket.io)
```

### Per-resource state shape

```ts
interface ListMeta {
  totalCount?: number
  totalPages?: number
  cursor?: string | null
  fetchedAt: number
  stale: boolean
}

interface OptimisticOp<T, U> {
  seq: number          // monotonic across the engine
  id: string
  patch: U             // raw patch as submitted to mutate()
  appliedAt: number
}

interface ResourceState<T> {
  serverById: Record<string, T>                 // last server-confirmed entity
  byId: Record<string, T>                       // computed = serverById + queued patches in order
  lists: Record<string, { ids: string[]; meta: ListMeta }>
  pendingOps: Record<string, OptimisticOp<T, unknown>[]>  // per-id ordered queue
  entitySeq: number                             // single monotonic counter
  listFetchSeq: Record<string, number>          // per listKey
  detailFetchSeq: Record<string, number>        // per id
  tombstones: Record<string, number>            // id → deletedAt (ms)
  // Per-id source bookkeeping for the source-preference rule (used when versionKey is absent
  // or versions tie). `lastSource` is the source of the most recent accepted byId write.
  sourceSeq: Record<string, {
    mutation: number; detail: number; list: number; socket: number; lastSource: SourceTag
  }>
}

interface SingletonState<T> {
  data: T | undefined
  fetchSeq: number
  isStale: boolean
}
```

The "computed" `byId[id]` is materialized eagerly (recomputed on each mutation to `serverById[id]` or `pendingOps[id]`), so component selectors stay synchronous and equality-checkable.

### Data flow — list read

1. Component calls `posts.useList(params)`.
2. Engine internally calls `useQuery({ queryKey, queryFn })`. The `queryFn` increments `listFetchSeq[hash(params)]`, then awaits `fetchers.list(params, { signal })`.
3. On params change, TanStack Query aborts the in-flight fetch via `signal`. The aborted request rejects in `ofetch`; the inject branch never executes.
4. After `await` resolves, **inside `queryFn`**, the engine calls `upsertList(params, response, mySeq)`. The mutator validates `state.listFetchSeq[hash(params)] === mySeq` before writing. Each entity in the response is also fed through the universal version guard against `serverById[id]`.
5. The hook returns `{ data, isPending, error, refetch, isFetching }`. `data` is derived from store: `lists[hash(params)].ids.map(id => byId[id]).filter(Boolean)`. `isPending` / `error` / `refetch` come from `useQuery`. The selector uses Zustand's `useShallow` to limit re-renders to actual list content changes.

### Data flow — detail read

Mirror of list read, with `detailFetchSeq[id]` and a single-entity inject that also goes through the version guard.

### Data flow — update (optimistic by default, command-queue model)

State invariant: `byId[id] = applyAll(serverById[id], pendingOps[id])`.

1. Component calls `update({ id, patch })` from `posts.useUpdate({ optimistic: true /* default */ })`.
2. Engine `onMutate`:
   - Allocates `mySeq = ++state.entitySeq` (engine-global).
   - Pushes `{ seq: mySeq, id, patch, appliedAt: Date.now() }` to `pendingOps[id]`.
   - Recomputes `byId[id]` from `serverById[id]` + new queue.
   - Returns `{ mySeq }`.
3. `mutationFn` issues the network request.
4. **On success** with server entity `server`:
   - Run universal version guard: if `server[versionKey] <= serverById[id][versionKey]`, drop and remove the op from queue (the server is reporting an older view than we already have; rare but possible if responses interleave).
   - Otherwise, set `serverById[id] = server`, remove the op with `seq === mySeq` from `pendingOps[id]`.
   - Recompute `byId[id]` from new `serverById[id]` + remaining queued ops in order.
5. **On error**:
   - Remove the op with `seq === mySeq` from `pendingOps[id]`.
   - Recompute `byId[id]` from `serverById[id]` + remaining queued ops.
   - This implicitly rolls back the failed op without disturbing in-flight earlier or later ops.
6. **List staleness on sort-key UPDATE**: if any field in `patch` ∈ `cfg.listInvalidationFields`, mark each list whose meta retains that field as a sort/filter key as stale and trigger refetch on next mount.

This model handles the four awkward cases:

| Sequence | Outcome |
|---|---|
| M1 ok, M2 ok | `serverById[id] = M2 server`, queue empty, `byId[id] = M2 server`. Correct. |
| M1 fail, M2 ok | M1 removed from queue → `byId[id] = serverById + [M2 patch]`; M2 ok updates `serverById = M2 server`, queue empty. |
| M1 ok, M2 fail | M1 ok updates `serverById = M1 server`, queue still `[M2 patch]`, `byId = M1 server + M2 patch`; M2 fail removes M2 → `byId = M1 server`. |
| M1 fail, M2 fail | both removed → `byId = serverById` (pre-M1 server state). |
| M2 ok, M1 ok (out-of-order success) | M2 ok updates `serverById = M2 server`, queue `[M1 op]` → `byId = M2 server + M1 patch` (which is wrong if M1 is older than M2 — caught by version guard, M1 dropped). |
| M2 fail, M1 ok | M2 removed → `byId = serverById + [M1 patch]`; M1 ok updates `serverById = M1 server` → version guard accepts (M1 is the only confirmed write so far) → `byId = M1 server`. |

If the server returns the same `versionKey` for both (no monotonic increment per write), the guard reduces to the source-preference rule (see below).

**Optimistic patch stacking semantics.** While M1 is in flight and M2 has already settled (with newer `versionKey`), `byId[id] = serverById[id] + [M1 op]` — i.e. M1's user intent is still visible on top of M2's confirmed server state. Conflicting fields favor M1 (later in the queue) until M1 settles. On M1 success, the version guard discards M1's older response and removes the op; `byId` collapses to `serverById`. On M1 failure, M1 is removed from the queue with the same effect. This is intentional optimistic-UI behavior, not a bug.

### Data flow — create / delete (server-completion + list refetch)

- **Create**: `mutationFn` runs; on success, engine sets `serverById[server.id] = server`, recomputes `byId[server.id]` (no pending ops yet), and triggers `invalidateList(...)` for affected lists (default: all lists of this resource; can be narrowed via `listInvalidator` config).
- **Delete**: `mutationFn` runs; on success, engine deletes `serverById[id]` and `byId[id]`, prunes `id` from every `lists[*].ids` array, **records `tombstones[id] = Date.now()`**, drops any pending optimistic ops queued on that id, and refetches affected lists. Tombstones expire after `TOMBSTONE_TTL` (30s) or on a fresh create that re-uses the id.

### Data flow — socket event

`SocketBridge` calls engine actions directly:

```ts
useSocketEvent(SocketEvent.POST_UPDATE,  (payload) => posts.injectEntity(payload))
useSocketEvent(SocketEvent.POST_CREATE,  ()        => posts.invalidateList())
useSocketEvent(SocketEvent.POST_DELETE,  ({ id })  => posts.removeEntity(id))
useSocketEvent(SocketEvent.COMMENT_CREATE, (p)     => comments.invalidateList())
```

`injectEntity` runs the universal version guard against `serverById[id]`; if newer, sets `serverById[id]` and recomputes `byId[id]` (preserving pending optimistic patches on top).

`removeEntity(id)`: deletes `serverById[id]`, `byId[id]`, `pendingOps[id]`, and `sourceSeq[id]`; records `tombstones[id] = Date.now()`; prunes `id` from all list `ids[]` arrays. Any subsequent settle of an in-flight mutation on this id is dropped by the seq check (op already removed) — final.

If a socket payload carries only an `id`, the engine offers `posts.refetchEntity(id)` which performs a single-detail fetch and routes through `injectEntity`.

**Acceptance prerequisite**: each migrated socket event must have its payload type narrowed beyond `unknown` in `src/lib/socket-events.ts` before the SocketBridge handler is wired. P1 acceptance test for SocketBridge depends on real payload capture; the audit is part of the task, not a follow-up.

---

## Cross-source ordering for non-versioned resources

For resources where `cfg.versionKey` is undefined, the universal version guard cannot resolve cross-source races. The engine falls back to a deterministic source-preference rule:

```
mutation result  >  detail response  >  socket inject  >  list response
```

Every inject path tags its write with the source. `serverById[id]` records the most recent write's source ordinal in `sourceSeq[id]`. A subsequent write of source S replaces only if its ordinal `≥` the recorded one (later writes from the same or stronger source win; weaker sources do not regress newer state).

This rule is approximate but operational: it favors the source most likely to carry intent (the user's own mutation) and demotes list responses, which arrive in batch and are often coarser. Resources sensitive to this approximation should add a `versionKey` (or a synthesized client-side timestamp at the source — see Open questions).

---

## Race control — nine scenarios

| # | Scenario | Defense |
|---|---|---|
| **a** | List params change mid-flight; old response arrives after new | `signal` propagates from `useQuery` into `ofetch`; aborted requests reject and never reach the inject branch. As secondary defense, `state.listFetchSeq[hash(params)] === mySeq` is checked inside the inject mutator before writing the list slot. |
| **b** | Multiple subscribers to same listKey | TanStack Query dedupes by queryKey; one in-flight per key. |
| **c** | List refetch returns entity stale relative to a confirmed mutation result | Universal version guard inside `upsertList`: per entity, if `incoming[versionKey] <= serverById[id][versionKey]`, the entity is dropped from the byId update; the list `ids[]` still records membership so list rendering remains coherent. |
| **d** | Out-of-order socket events deliver an older entity version | `injectEntity` runs the universal version guard; older or equal is dropped. |
| **e** | Same entity mutated twice in quick succession; older response arrives later | Command queue model + version guard. The earlier mutation's success is folded into `serverById` only if its `versionKey` is newer than current; otherwise dropped. The later mutation's queued op remains and `byId` reflects the latest optimistic. |
| **f** | Component unmounts mid-fetch | TanStack Query reference-counts observers; with no observers it cancels the fetch via `signal`. Inject runs only inside `queryFn` and inherits the abort. |
| **g** | Mutation onError collides with an unrelated newer mutation on the same id | Command queue model: removing the failed op from `pendingOps[id]` and recomputing `byId` does not disturb other queued ops; their patches still apply. |
| **h** | Detail fetch races with list fetch / socket / mutation result for the same id | `detailFetchSeq[id]` plus the universal version guard. Only the latest detail fetch can write `serverById[id]`, and even then only if the response's version exceeds what is already known. |
| **i** | Stale list/detail/socket response after a confirmed DELETE resurrects the entity | `tombstones[id]` is consulted in every inject path (`upsertList`, `injectEntity`, `injectMutationResult`); a write whose id is tombstoned is dropped (the id is also pruned from any list `ids[]` written in that same response). Tombstones expire after `TOMBSTONE_TTL`. |

Each scenario gets a dedicated unit test with controlled fetcher timing (resolved promises in deterministic order). Resources without `versionKey` are tested under the source-preference rule.

---

## Engine API

```ts
// src/stores/data/types.ts

export interface FetchOpts {
  signal: AbortSignal
}

export interface RelationDef {
  table: string
  fk: string
  kind?: 'one' | 'many'
}

export interface BackendPagination {
  totalCount?: number
  totalPages?: number
  currentPage?: number
  cursor?: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination?: BackendPagination
  meta?: Partial<Pick<ListMeta, 'totalCount' | 'totalPages' | 'cursor'>>
}

export type SourceTag = 'mutation' | 'detail' | 'socket' | 'list'

export interface ResourceConfig<
  T,
  ListParams = unknown,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
> {
  name: string
  pk?: keyof T                                  // default 'id'; engine uses this consistently
  versionKey?: keyof T                          // for universal version guard
  relations?: Record<string, RelationDef>
  listInvalidationFields?: (keyof T)[]          // patches touching these mark lists stale
  fetchers: {
    list?:   (params: ListParams, opts: FetchOpts) => Promise<PaginatedResponse<T> | T[]>
    detail?: (id: string, opts: FetchOpts) => Promise<T>
    create?: (input: CreateInput) => Promise<T>
    update?: (id: string, patch: UpdateInput) => Promise<T>
    delete?: (id: string) => Promise<void>
  }
  // Narrow list invalidation. For DELETE, `changed` may be `{ id }` if the entity was already evicted.
  listInvalidator?: (
    op: 'create' | 'delete' | 'update',
    changed: T | { id: string },
  ) => (params: ListParams) => boolean
}

export interface ResourceTable<T, P, C, U> {
  // hooks
  useList:   (params: P) => UseListResult<T>
  useEntity: (id: string | undefined) => UseEntityResult<T>
  useCreate: () => UseMutationResult<T, unknown, C>
  useUpdate: (opts?: { optimistic?: boolean }) => UseMutationResult<T, unknown, { id: string; patch: U }>  // optimistic defaults to true
  useDelete: () => UseMutationResult<void, unknown, string>

  // imperative
  injectEntity:   (entity: T) => void
  injectMany:     (entities: T[]) => void
  removeEntity:   (id: string) => void
  invalidateList: (predicate?: (params: P) => boolean) => void
  refetchEntity:  (id: string) => Promise<T | undefined>

  // selectors
  get:     (id: string) => T | undefined
  getList: (params: P) => T[] | undefined
}

export interface UseListResult<T> {
  data: T[]
  meta: ListMeta | undefined
  isPending: boolean
  isFetching: boolean
  error: unknown
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<T[]>>
}

export interface UseEntityResult<T> {
  data: T | undefined
  isPending: boolean
  isFetching: boolean
  error: unknown
  refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<T>>
}

// `T` is no longer constrained to `{ id: string }`. Configure `cfg.pk` (default 'id') to point to
// the entity's primary-key field, which must resolve to `string`.
export function createResourceTable<
  T,
  P = unknown,
  C = Partial<T>,
  U = Partial<T>,
>(cfg: ResourceConfig<T, P, C, U>): ResourceTable<T, P, C, U>

// Companion for resources without `id` and without lists (e.g. appInfo).
export interface SingletonConfig<T> {
  name: string
  versionKey?: keyof T
  fetcher: (opts: FetchOpts) => Promise<T>
  updater?: (patch: Partial<T>) => Promise<T>
}

export interface SingletonResource<T> {
  use:        () => { data: T | undefined; isPending: boolean; isFetching: boolean; error: unknown; refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<T>> }
  useUpdate:  () => UseMutationResult<T, unknown, Partial<T>>
  inject:     (data: T) => void
  get:        () => T | undefined
}

export function createSingletonResource<T>(cfg: SingletonConfig<T>): SingletonResource<T>
```

### Engine internals (sketch)

```ts
// src/stores/data/create-resource.ts

const TOMBSTONE_TTL = 30_000   // ms; default 30s; configurable globally if a resource needs different

export function createResourceTable<T, P, C, U>(cfg: ResourceConfig<T, P, C, U>) {
  const { name } = cfg
  const pk = (cfg.pk ?? ('id' as keyof T))
  registerSlice(name)

  function recompute(state, id: string) {
    const slice = state[name] as ResourceState<T>
    const server = slice.serverById[id]
    const ops = slice.pendingOps[id] ?? []
    if (!server && ops.length === 0) {
      delete slice.byId[id]
      return
    }
    let computed = server ? { ...server } : ({ [pk]: id } as unknown as T)
    for (const op of ops) computed = { ...computed, ...(op.patch as object) } as T
    slice.byId[id] = computed
  }

  const SOURCE_RANK: Record<SourceTag, number> = { mutation: 4, detail: 3, socket: 2, list: 1 }

  function passGuard(slice: ResourceState<T>, incoming: T, source: SourceTag): boolean {
    const id = String(incoming[pk])
    const cur = slice.serverById[id]
    // Versioned resources: monotonic version wins, ties broken by source rank.
    if (cfg.versionKey) {
      if (!cur) return true
      const inV = (incoming as any)[cfg.versionKey]
      const stV = (cur as any)[cfg.versionKey]
      if (inV != null && stV != null) {
        if (inV > stV) return true
        if (inV < stV) return false
      }
      // version equal or missing — fall through to source-preference
    }
    // Non-versioned resources OR equal versions: use source-preference rule.
    const lastSource = (slice.sourceSeq[id]?.lastSource ?? 'list') as SourceTag
    return SOURCE_RANK[source] >= SOURCE_RANK[lastSource]
  }

  function recordSource(slice: ResourceState<T>, id: string, source: SourceTag) {
    const prev = slice.sourceSeq[id] ?? { mutation: 0, detail: 0, socket: 0, list: 0, lastSource: 'list' }
    slice.sourceSeq[id] = { ...prev, [source]: prev[source] + 1, lastSource: source } as any
  }

  function tombstoneActive(slice: ResourceState<T>, id: string, now: number): boolean {
    const ts = slice.tombstones[id]
    if (!ts) return false
    if (now - ts < TOMBSTONE_TTL) return true
    delete slice.tombstones[id]      // lazy prune
    return false
  }

  // Called inside list queryFn after await.
  function upsertList(params: P, response: PaginatedResponse<T> | T[], mySeq: number) {
    const { data, meta } = normalizeListResponse(response)                 // (I3)
    useDataStore.setState((state) => {
      const slice = state[name] as ResourceState<T>
      const key = hash(params)
      if (slice.listFetchSeq[key] !== mySeq) return state                  // (a)
      const now = Date.now()
      const ids: string[] = []
      for (const entity of data) {
        const id = String(entity[pk])
        if (tombstoneActive(slice, id, now)) continue                      // (i)
        ids.push(id)
        if (passGuard(slice, entity, 'list')) {                            // (c) + B4
          slice.serverById[id] = entity
          recordSource(slice, id, 'list')
          recompute(state, id)
        }
      }
      slice.lists[key] = { ids, meta: { ...meta, fetchedAt: now, stale: false } }
    })
  }

  function injectMutationResult(id: string, server: T, mySeq: number) {
    useDataStore.setState((state) => {
      const slice = state[name] as ResourceState<T>
      const ops = slice.pendingOps[id] ?? []
      const idx = ops.findIndex((o) => o.seq === mySeq)
      if (idx === -1) return                                              // already removed (rare)
      ops.splice(idx, 1)
      slice.pendingOps[id] = ops
      const now = Date.now()
      if (!tombstoneActive(slice, id, now) && passGuard(slice, server, 'mutation')) {  // (e)+(h)+(i)
        slice.serverById[id] = server
        recordSource(slice, id, 'mutation')
      }
      recompute(state, id)
    })
  }

  function rollback(id: string, mySeq: number) {
    useDataStore.setState((state) => {
      const slice = state[name] as ResourceState<T>
      const ops = slice.pendingOps[id] ?? []
      const idx = ops.findIndex((o) => o.seq === mySeq)
      if (idx === -1) return
      ops.splice(idx, 1)
      slice.pendingOps[id] = ops
      recompute(state, id)                           // (g)
    })
  }

  function injectEntity(entity: T, source: SourceTag = 'socket') {
    useDataStore.setState((state) => {
      const slice = state[name] as ResourceState<T>
      const id = String(entity[pk])
      const now = Date.now()
      if (tombstoneActive(slice, id, now)) return                          // (i)
      if (!passGuard(slice, entity, source)) return                        // (d) + B4
      slice.serverById[id] = entity
      recordSource(slice, id, source)
      recompute(state, id)
    })
  }
  // Detail-fetch path passes source='detail' explicitly; SocketBridge uses default 'socket'.

  function removeEntity(id: string) {
    useDataStore.setState((state) => {
      const slice = state[name] as ResourceState<T>
      delete slice.serverById[id]
      delete slice.byId[id]
      delete slice.pendingOps[id]                                          // drop optimistic intent (final)
      delete slice.sourceSeq[id]
      slice.tombstones[id] = Date.now()                                    // (i)
      for (const k of Object.keys(slice.lists)) {
        const list = slice.lists[k]
        const next = list.ids.filter((x) => x !== id)
        if (next.length !== list.ids.length) slice.lists[k] = { ...list, ids: next }
      }
    })
  }

  function injectCreate(server: T) {
    useDataStore.setState((state) => {
      const slice = state[name] as ResourceState<T>
      const id = String(server[pk])
      delete slice.tombstones[id]                                          // re-create clears tombstone
      slice.serverById[id] = server
      recordSource(slice, id, 'mutation')
      recompute(state, id)
    })
  }

  function useUpdate(opts?: { optimistic?: boolean }) {
    const optimistic = opts?.optimistic ?? true
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: U }) => cfg.fetchers.update!(id, patch),
      onMutate: ({ id, patch }) => {
        if (!optimistic) return { mySeq: 0 }
        let mySeq = 0
        useDataStore.setState((state) => {
          const slice = state[name] as ResourceState<T>
          mySeq = ++slice.entitySeq
          const ops = slice.pendingOps[id] ?? []
          ops.push({ seq: mySeq, id, patch, appliedAt: Date.now() })
          slice.pendingOps[id] = ops
          recompute(state, id)
        })
        // sort-key staleness — mark + actively refetch mounted lists
        const fields = cfg.listInvalidationFields ?? []
        if (fields.some((f) => Object.prototype.hasOwnProperty.call(patch, f))) {
          markListsStale(name)
          queryClient.invalidateQueries({ queryKey: ['data', name, 'list'] })
        }
        return { mySeq }
      },
      onSuccess: (server, vars, ctx) => {
        if (optimistic) injectMutationResult(vars.id, server, ctx!.mySeq)
        else injectEntity(server)
      },
      onError: (_err, vars, ctx) => {
        if (optimistic && ctx) rollback(vars.id, ctx.mySeq)
      },
    })
  }

  function useList(params: P) {
    const result = useQuery<T[], unknown>({
      queryKey: ['data', name, 'list', params],
      queryFn: async ({ signal }) => {
        let mySeq = 0
        useDataStore.setState((state) => {
          const slice = state[name] as ResourceState<T>
          mySeq = (slice.listFetchSeq[hash(params)] ?? 0) + 1
          slice.listFetchSeq[hash(params)] = mySeq
        })
        const raw = await cfg.fetchers.list!(params, { signal })
        upsertList(params, raw, mySeq)            // performs normalizeListResponse internally
        const { data } = normalizeListResponse(raw)
        return data                                // queryFn returns normalized T[]
      },
    })
    const data = useDataStore(useShallow((s) => {
      const slice = s[name] as ResourceState<T>
      const list = slice.lists[hash(params)]
      return list ? list.ids.map((id) => slice.byId[id]).filter(Boolean) : []
    }))
    const meta = useDataStore((s) => (s[name] as ResourceState<T>).lists[hash(params)]?.meta)
    return {
      data,
      meta,
      isPending: result.isPending,
      isFetching: result.isFetching,
      error: result.error,
      refetch: result.refetch,
    }
  }

  // useEntity, useCreate, useDelete, invalidateList, refetchEntity, getters: omitted; same patterns.

  return { /* all of the above */ }
}
```

### Per-resource definition (example)

```ts
// src/stores/data/resources/posts.ts
import { createResourceTable } from '../create-resource'
import { postsApi } from '~/api/posts'
import type { PostModel } from '~/models'

export const posts = createResourceTable<PostModel, PostsListParams>({
  name: 'posts',
  versionKey: 'modified',
  listInvalidationFields: ['pinned', 'created', 'modified', 'categoryId'],
  relations: { category: { table: 'categories', fk: 'categoryId' } },
  fetchers: {
    list:   (params, { signal }) => postsApi.getList(params, { signal }),
    detail: (id, { signal })     => postsApi.getById(id, { signal }),
    create: postsApi.create,
    update: postsApi.update,
    delete: postsApi.delete,
  },
})
```

```ts
// src/stores/data/resources/app-info.ts
import { createSingletonResource } from '../create-singleton'
import { systemApi } from '~/api/system'
import type { AppInfoModel } from '~/api/system'

export const appInfo = createSingletonResource<AppInfoModel>({
  name: 'appInfo',
  fetcher: ({ signal }) => systemApi.appInfo({ signal }),
})
```

### Component usage

```tsx
import { posts } from '~/stores/data/resources/posts'

function PostList() {
  const { data, isPending } = posts.useList({ page: 1, size: 20 })
  const { mutate: update } = posts.useUpdate()  // optimistic by default

  return (
    <ul>
      {data.map((p) => (
        <li key={p.id} onClick={() => update({ id: p.id, patch: { pinned: !p.pinned } })}>
          {p.title}
        </li>
      ))}
    </ul>
  )
}
```

### Relation resolution (deferred to consumer)

Default API does not auto-join relations on read. Consumers compose:

```ts
const post = posts.useEntity(id)
const category = categories.useEntity(post.data?.categoryId)
```

A future opt-in `posts.useEntity(id, { with: ['category'] })` may land in P3 if usage shows it pays for itself. The `relations` config field is reserved so adding it later is non-breaking.

---

## Pagination contract

Backend list endpoints typically return `{ data: T[], pagination: { totalCount, totalPages, currentPage } }`, with some legacy endpoints returning a bare array or `{ data: T[] }` only. The current `request.ts` `transformResponse` unwraps `{ data: [...] }` to `T[]`, discarding sibling pagination metadata.

**P0 changes**:

1. `src/lib/request.ts` — relax the auto-unwrap. Only unwrap when the response object's own keys are exactly `['data']` (or only `data` plus an empty/null sibling). When other siblings are present, return the full object.
2. `engine adapter` — `cfg.fetchers.list` returns `Promise<PaginatedResponse<T> | T[]>`. The engine normalizes:

   ```ts
   function normalizeListResponse<T>(r: PaginatedResponse<T> | T[]): { data: T[]; meta: ListMeta } {
     const now = Date.now()
     if (Array.isArray(r)) {
       return { data: r, meta: { totalCount: r.length, totalPages: 1, fetchedAt: now, stale: false } }
     }
     // map backend `pagination` → engine `meta`
     const p = (r as any).pagination
     return {
       data: r.data,
       meta: {
         totalCount: p?.totalCount ?? r.meta?.totalCount,
         totalPages: p?.totalPages ?? r.meta?.totalPages,
         cursor:     p?.cursor     ?? r.meta?.cursor ?? null,
         fetchedAt: now,
         stale: false,
       },
     }
   }
   ```

3. Unit tests cover all three shapes (bare array, `{ data }` only, `{ data, pagination }`).

After P0, every `useList` consumer receives a stable `meta: ListMeta`; backend `pagination` is mapped once at the boundary.

---

## Single-store fan-out — selector strategy

A single `useDataStore` with N resource slices and M components subscribed via `useList` / `useEntity` requires care:

- `useList` selector composes via `useShallow` from `zustand/shallow`: returns a new array of entity references; identical content (by reference) skips re-render.
- `useEntity(id)` selector returns `byId[id]` directly; reference equality skips re-render unless that entity changed.
- The engine writes via `setState` with structural sharing on the affected slice only (other slices retain reference equality).
- For high-traffic scenarios (socket-heavy `comments` view), the recomputation step on `serverById` mutation only allocates new objects for ids actually written; unrelated entities keep their reference.

Acceptance includes a render-count smoke test on the `comments` view: a sequence of 50 socket `COMMENT_CREATE` events should not cause unrelated `posts` consumers to re-render.

---

## Persistence

- No IndexedDB.
- AI slice persistence (formerly via TanStack Query persister, key `mx-admin-query-cache`, dehydrate `['ai']`) moves to Zustand `persist` middleware:

  ```ts
  persist(useDataStore, {
    name: 'mx-admin:data',
    partialize: (s) => ({ ai: s.ai }),
    version: 1,
    migrate: (persisted, version) => persisted, // placeholder; see Open questions
  })
  ```

- `mx-admin-query-cache` key is removed. `bootPersistence()` in `src/lib/query-client.ts` is deleted.

---

## Socket bridge rewrite

`src/components/shared/SocketBridge.tsx` no longer calls `queryClient.invalidateQueries`. Each event maps to an engine action. **Before** wiring, each event's payload type must be narrowed in `src/lib/socket-events.ts` (currently typed as `unknown` for most domain events). The audit is part of P1 acceptance, not a follow-up.

| Event | Action | Payload requirement |
|---|---|---|
| `POST_UPDATE` | `posts.injectEntity(payload)` | full `PostModel` with `modified` |
| `POST_CREATE` | `posts.invalidateList()` | none required |
| `POST_DELETE` | `posts.removeEntity(payload.id)` | `{ id }` |
| `NOTE_*` | analogous | analogous |
| `SAY_*` | analogous | analogous |
| `COMMENT_CREATE` | `comments.invalidateList()` (+ optional toast) | none |
| `PAGE_UPDATED` | `pages.injectEntity(payload)` | full model |
| `LINK_APPLY` | `linkApplies.invalidateList()` | none |
| `CONTENT_REFRESH` | iterate all registered resources → `invalidateList()` | none |
| `ADMIN_NOTIFICATION` | toast only (no store change) | `{ type, message }` |
| `AUTH_FAILED` | unchanged (delegates to auth events) | n/a |
| `GATEWAY_DISCONNECT` | unchanged | n/a |
| `DANMAKU_CREATE` | toast only at P1 (no resource table yet); revisit if a danmaku view lands | `unknown` → narrow only when wired |
| `IMAGE_REFRESH` / `IMAGE_FETCH` | not in pilot scope; deferred to P3 when an image-management view exists | deferred |
| `VISITOR_ONLINE` / `VISITOR_OFFLINE` | not store-bound; if used, route to a Jotai counter atom (not a resource table) | deferred |
| `GATEWAY_CONNECT` | unchanged (connection lifecycle only) | n/a |

Where the backend payload is missing the entity body but provides only an `id`, the SocketBridge handler instead calls `<resource>.refetchEntity(id)`, which routes through the detail-fetch path with `detailFetchSeq` + version guard.

---

## Migration plan

### P0 — engine

1. `src/stores/data/types.ts` — `ResourceState`, `SingletonState`, `ListMeta`, `OptimisticOp`, `ResourceConfig`, `SingletonConfig`, `FetchOpts`, `RelationDef`, `PaginatedResponse`, `ResourceTable`, `SingletonResource`.
2. `src/stores/data/store.ts` — `useDataStore` (single Zustand instance, devtools middleware, persist for `ai`), `registerSlice`, `setSlice`, `hash`, `markListsStale`.
3. `src/stores/data/create-resource.ts` — engine implementation per the sketch above.
4. `src/stores/data/create-singleton.ts` — singleton companion.
5. `src/stores/data/index.ts` — barrel.
6. `src/lib/request.ts` — relax auto-unwrap to preserve pagination meta when response carries siblings beyond `data`. Unit test both shapes.
7. Unit tests covering all nine race scenarios with controlled fetcher timing.
8. Devtools labels follow `'<resource>/<action>'` convention (e.g. `'posts/upsertList'`, `'posts/injectMutationResult'`, `'posts/recompute'`).

### P1 — pilot three resources

| Resource | Selection rationale |
|---|---|
| `appInfo` | Singleton — verifies `createSingletonResource` and confirms inject + version guard on a no-list path. |
| `posts` | Classic list + detail + sort-key UPDATE (`pinned`) — exercises `listInvalidationFields` + the full race envelope. |
| `comments` | High-frequency socket pushes (`COMMENT_CREATE`) — validates SocketBridge integration and fan-out smoke test. |

For each, create `src/stores/data/resources/<name>.ts`. Pilot views consume the new tables. Existing hook names (`useAppInfoQuery`) remain as thin re-exports during P1 to avoid mass diff:

```ts
// src/hooks/queries/use-app-info.ts (P1 transitional)
import { appInfo } from '~/stores/data/resources/app-info'
export const useAppInfoQuery = appInfo.use
```

### P2 — SocketBridge rewrite

Migrate all event handlers as listed in the table above. **Audit prerequisite**: narrow `SocketEventPayloadMap` in `src/lib/socket-events.ts` for every routed event. Remove any remaining `queryClient.invalidateQueries(queryKeys.<resource>.*)` call sites.

### P3 — remaining resources

Per spec 11's view migration cadence. Each view's prerequisite is its resource table(s). Resource definitions are mechanical given an existing `src/api/<resource>.ts`.

### P4 — cleanup

- Delete `src/hooks/queries/keys.ts` (engine manages internal keys).
- Delete legacy hook files under `src/hooks/queries/` once their views land in P3.
- Delete `bootPersistence()` and the `mx-admin-query-cache` key.
- Update spec 05 with a "superseded by 2026-05-10-data-flow-redesign-design" header on the relevant sections.

---

## Error and loading semantics

- **Engine list/entity hooks** return `{ data, isPending, isFetching, error, refetch }`:
  - `data` from store (selector + `useShallow`).
  - `isPending` / `isFetching` / `error` / `refetch` from `useQuery` directly (matches v5 result shape).
- **Mutation hooks** return native `useMutation` results (`isPending`, `error`, `mutate`, `mutateAsync`).
- **Global error handling**: unchanged. `BusinessError` toasts at call site (mutation `onError` may also handle); `SystemError` falls through to the global query error toast. `AuthErrorBridge` and `SocketBridge` continue to handle `AUTH_FAILED` / forced 401.

---

## Testing

| Layer | Coverage |
|---|---|
| Unit · engine | All nine race scenarios. Mock fetcher with controlled `setTimeout`s; assert final `serverById` / `byId` / `pendingOps` state. |
| Unit · command queue | Six interleavings from the *Data flow — update* truth table; parametrized test asserting final `byId[id]`. |
| Unit · per resource | `posts`: list inject (with pagination meta), entity inject, optimistic update success / failure / rollback / interleaved, create + invalidateList, delete + invalidateList + list pruning, socket inject + version guard, sort-key UPDATE marks lists stale. |
| Unit · singleton | `appInfo`: fetch → inject; updater path; version guard. |
| Integration · pilot | `posts` view full chain: mount → list renders, optimistic edit → both list and detail re-render once, socket `POST_UPDATE` → byId patch propagates, mutation in-flight + forced list refetch → optimistic state preserved, sort-key edit triggers list refetch. |
| Integration · fan-out | `comments` view: 50 socket `COMMENT_CREATE` events → `posts` consumers do not re-render; assert via render-count probe. |
| Smoke · migration | After replacing `useAppInfoQuery` internals, dependent views render equivalently. |

Race-scenario tests use a fetcher harness with explicit promise resolution control:

```ts
test('two updates to same id; older response is discarded by version guard', async () => {
  const harness = createFetcherHarness<Post>()
  const { mutate } = renderHook(() => posts.useUpdate()).result.current
  act(() => mutate({ id: 'p1', patch: { title: 'A' } }))
  act(() => mutate({ id: 'p1', patch: { title: 'B' } }))
  await harness.resolve(1, { id: 'p1', title: 'A', modified: 100 })
  await harness.resolve(0, { id: 'p1', title: 'B', modified: 50 })  // older
  expect(usePostsState().byId.p1.title).toBe('A')
})
```

---

## Acceptance criteria

### P0

1. `useDataStore` is the single Zustand instance for all server data.
2. `createResourceTable<T, P, C, U>` and `createSingletonResource<T>` produce the API shapes in this spec.
3. All nine race-scenario unit tests pass; the command-queue truth table tests pass.
4. `src/lib/request.ts` preserves pagination metadata when the response object carries siblings beyond `data`.
5. Zustand redux-devtools middleware is enabled in dev with `'<resource>/<action>'` action labels.
6. AI slice persists across reload via Zustand `persist` middleware; legacy `mx-admin-query-cache` key is removed.

### P1

1. `posts`, `comments`, `appInfo` are migrated.
2. SocketBridge invokes engine actions for all events listed in the *Socket bridge rewrite* table; payload types in `src/lib/socket-events.ts` are narrowed beyond `unknown` for every routed event.
3. Pilot integration test passes: with a `posts` view mounted and an optimistic update in flight, a forced list refetch does not erase the optimistic patch.
4. Fan-out smoke test on `comments` view passes the render-count probe.

### P3 — per view (delegated to spec 11)

Each migrated view exposes its resource table(s) under `src/stores/data/resources/`. View renders no longer depend on `queryClient` directly. `src/hooks/queries/use-<resource>.ts` legacy files are deleted.

### P4

- `queryKeys` constant is removed; engine manages internal keys.
- Spec 05 carries a supersession note pointing here.

---

## Open questions

1. **Relation resolution API.** Is `useEntity(id, { with: ['category'] })` worth the cost vs. composed reads? Decide during P3 when usage data accumulates. Current default: composed reads only.
2. **Backend pagination shape.** `mx-core` endpoints' real envelope shape varies (some return `{ data, pagination }`, some return `T[]`). P0 audit one endpoint per resource family during the `request.ts` change to confirm the relax-unwrap rule covers all observed shapes.
3. **Cross-resource cascade invalidation.** Editing a category may affect lists of `posts` filtered by that category. The engine exposes `listInvalidator` per resource; the actual cascade rules land per resource during P3.
4. **Devtools action naming convention.** Single store with N slices × M actions per slice makes the action timeline noisy. `'<resource>/<action>'` is the convention; revisit if dev experience suffers.
5. **Persist version migration.** When the AI slice shape changes, a `migrate` function is required in the persist config. Define migration policy when the first shape change lands.
6. **CONTENT_REFRESH semantics.** The legacy `window.bus` behavior was a full page reload. Mapping to "iterate all registered resources → invalidateList" is a softer behavior; verify it is sufficient during P1.
7. **Optimistic CREATE / DELETE.** Currently excluded by decision. If a future view requires optimistic create (e.g. AI task queue), the command-queue model already supports temp-id ops, but the public API and acceptance criteria for that path are not specified here.
8. **`versionKey` absence fallback.** Resources without a monotonic version field rely on the source-preference rule (mutation > detail > socket > list); see *Cross-source ordering for non-versioned resources*. Per-resource decision during P3: stay with source-preference, or synthesize a client-side `Date.now()` field at inject time. The latter requires a wrapper config option which is not specified at P0.
9. **TOMBSTONE_TTL value.** Default 30s. Verify during P1 against observed socket lag and detail-fetch latency tails; bump to 60s if the pilot shows resurrection cases.

---

## Changelog

- 2026-05-10 (rev 5): final Codex pass — `recompute` uses `[pk]: id` instead of hardcoded `id`, supporting non-default primary keys.
- 2026-05-10 (rev 4): third Codex verification pass — dropped `T extends { id: string }` constraint everywhere; pk-driven entity access throughout; introduced `passGuard` (subsuming version + source-preference) and `recordSource`; added `lastSource` to `sourceSeq`; introduced `tombstoneActive` with lazy TTL prune; added `injectCreate` clearing tombstone on re-create; list `queryFn` now returns normalized `T[]` so refetch typing aligns; `BackendPagination` and `pagination` field added to `PaginatedResponse`; `normalizeListResponse` is now actually called inside `upsertList`; `useUpdate.onMutate` actively `queryClient.invalidateQueries` for sort-key updates; socket section reconciled with sketch (pendingOps deleted on remove); scenario count corrected to nine.
- 2026-05-10 (rev 3): second Codex verification pass — added scenario (i) for tombstoned-entity resurrection, with `tombstones: Record<id, ms>` and TOMBSTONE_TTL pruning across every inject path; added *Cross-source ordering for non-versioned resources* section with explicit source-preference rule; tightened sort-key UPDATE to actively `invalidateQueries` for mounted lists in addition to marking stale; specified `normalizeListResponse` and the three accepted backend list shapes; clarified optimistic-stacking semantics (intentional, not a bug); refined `refetch` signature to `(options?: RefetchOptions) => Promise<QueryObserverResult<T|T[]>>`; enumerated remaining socket events (`DANMAKU_CREATE`, `IMAGE_*`, `VISITOR_*`, `GATEWAY_CONNECT`) with explicit dispositions.
- 2026-05-10 (rev 2): first Codex review pass — moved inject from removed v5 `onSuccess` callback to inside `queryFn`; introduced command-queue model for optimistic mutations; added universal entity-version guard; added `createSingletonResource` companion for `appInfo`; added detail-fetch race scenario (h); added `listInvalidationFields` for sort-key updates; defined `PaginatedResponse` and pagination contract; specified `useShallow` selector strategy and fan-out test; tightened `removeEntity` to prune list refs; broadened `listInvalidator.changed` to `T | { id: string }`; corrected hook return shapes; narrowed `pk` usage; documented socket payload audit as in-scope.
- 2026-05-10 (rev 1): initial design.
