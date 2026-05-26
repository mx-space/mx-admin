import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReaderWithKey } from '../types/readers'

import { getReaders } from '~/api/readers'

import { readersPageSize } from '../constants'

export function useReadersList() {
  const [page, setPage] = useState(1)
  const [readerList, setReaderList] = useState<ReaderWithKey[]>([])
  const seenKeysRef = useRef(new Set<string>())
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const readersQuery = useQuery({
    queryFn: () => getReaders({ page, size: readersPageSize }),
    queryKey: ['readers', 'list', page, readersPageSize],
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

  const loadNextPage = () => {
    if (hasNextPage) setPage((current) => current + 1)
  }

  return {
    hasNextPage,
    loadMoreRef,
    loadNextPage,
    pagination,
    readers,
    readersQuery,
    scrollContainerRef,
  }
}
