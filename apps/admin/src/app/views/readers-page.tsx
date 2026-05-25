import { useQuery } from '@tanstack/react-query'
import { Crown, Loader2, Mail, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReaderModel } from '../api/readers'

import { getReaders } from '../api/readers'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { Scroll } from '../ui/scroll'

const pageSize = 20

type ReaderWithKey = ReaderModel & { _key: string }

export function ReadersPage() {
  const [page, setPage] = useState(1)
  const [readerList, setReaderList] = useState<ReaderWithKey[]>([])
  const seenKeysRef = useRef(new Set<string>())
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const readersQuery = useQuery({
    queryFn: () => getReaders({ page, size: pageSize }),
    queryKey: ['readers', 'list', page, pageSize],
  })

  const pagination = readersQuery.data?.pagination
  const hasNextPage = pagination ? page < pagination.totalPages : false
  const readers = useMemo(() => readerList, [readerList])

  useEffect(() => {
    if (!readersQuery.data) return

    if (page === 1) {
      seenKeysRef.current = new Set()
    }

    const nextReaders = readersQuery.data.data
      .map((reader, index) => ({
        ...reader,
        _key: `${reader.id}-${reader.provider || index}`,
      }))
      .filter((reader) => {
        if (seenKeysRef.current.has(reader._key)) return false
        seenKeysRef.current.add(reader._key)
        return true
      })

    setReaderList((current) =>
      page === 1 ? nextReaders : [...current, ...nextReaders],
    )
  }, [page, readersQuery.data])

  useEffect(() => {
    const target = loadMoreRef.current
    const root = scrollContainerRef.current
    if (!target || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((entry) => entry.isIntersecting) &&
          !readersQuery.isFetching
        ) {
          setPage((current) => current + 1)
        }
      },
      { root, rootMargin: '200px' },
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [hasNextPage, readersQuery.isFetching])

  return (
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="min-w-0">
          <h2 className="inline-flex items-center gap-2 text-sm font-medium text-neutral-950 dark:text-neutral-50">
            <Users aria-hidden="true" className="size-4" />
            读者
          </h2>
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {pagination ? `${pagination.total} 位` : '加载中'}
        </span>
      </div>

      <Scroll className="flex-1" ref={scrollContainerRef}>
        <div className="mx-auto max-w-4xl">
          {readersQuery.isLoading && readers.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-neutral-400">
              Loading readers...
            </div>
          ) : readers.length === 0 ? (
            <ReaderEmptyState />
          ) : (
            <div>
              {readers.map((reader) => (
                <ReaderItem data={reader} key={reader._key} />
              ))}
              {hasNextPage ? <div ref={loadMoreRef} /> : null}
            </div>
          )}
        </div>
      </Scroll>

      {pagination ? (
        <div className="flex shrink-0 items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <span>
            已加载 {readers.length} / {pagination.total}
          </span>
          <Button
            disabled={!hasNextPage || readersQuery.isFetching}
            onClick={() => {
              if (hasNextPage) setPage((current) => current + 1)
            }}
            type="button"
            variant="subtle"
          >
            {readersQuery.isFetching ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {hasNextPage ? '加载更多' : '已全部加载'}
          </Button>
        </div>
      ) : null}
    </section>
  )
}

function ReaderItem(props: { data: ReaderWithKey }) {
  const reader = props.data

  return (
    <article className="group flex items-center gap-4 border-b border-neutral-200 px-4 py-3 transition-colors last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/50">
      <div className="relative shrink-0">
        <img
          alt=""
          className="size-10 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
          src={
            reader.image ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(reader.name)}&background=random`
          }
        />
        {reader.provider ? (
          <div className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-700">
            <ProviderIcon provider={reader.provider} size={10} />
          </div>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {reader.name}
          </span>
          {reader.role === 'owner' ? (
            <span
              className="flex size-4 items-center justify-center rounded-full bg-amber-500/10 text-amber-500"
              title="站长"
            >
              <Crown aria-hidden="true" className="size-2.5" />
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-3">
          {reader.handle ? (
            <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="text-neutral-400">@</span>
              <span className="truncate">{reader.handle}</span>
            </span>
          ) : null}
          {reader.email ? (
            <span
              className="flex shrink-0 items-center gap-1 text-xs text-neutral-400 opacity-60 transition-opacity group-hover:opacity-100 dark:text-neutral-500"
              title={reader.email}
            >
              <Mail aria-hidden="true" className="size-3" />
              <span className="hidden sm:inline">{reader.email}</span>
            </span>
          ) : null}
        </div>
      </div>

      {reader.provider ? (
        <div className="hidden shrink-0 sm:block">
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs capitalize text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {reader.provider}
          </span>
        </div>
      ) : null}
    </article>
  )
}

function ReaderEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Users
        aria-hidden="true"
        className="mb-4 size-12 text-neutral-300 dark:text-neutral-600"
      />
      <p className="text-sm text-neutral-500 dark:text-neutral-400">暂无读者</p>
    </div>
  )
}

function ProviderIcon(props: { provider: string; size: number }) {
  const style = {
    height: `${props.size}px`,
    width: `${props.size}px`,
  }

  if (props.provider === 'github') {
    return (
      <span
        className="flex items-center justify-center text-neutral-900 dark:text-neutral-100"
        style={style}
      >
        <GithubIcon />
      </span>
    )
  }

  return (
    <img
      alt={props.provider}
      height={props.size}
      src={`https://authjs.dev/img/providers/${props.provider}.svg`}
      style={style}
      width={props.size}
    />
  )
}

const GithubIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
  </svg>
)
