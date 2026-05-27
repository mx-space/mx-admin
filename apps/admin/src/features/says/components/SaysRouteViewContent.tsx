import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Quote } from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { SayModel } from '~/models/say'

import { deleteSay, getSays } from '~/api/says'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useI18n } from '~/i18n'
import { CompactPagination } from '~/ui/data/compact-pagination'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { cn } from '~/utils/cn'

import { saysPageSize } from '../constants'
import { readSaysPage } from '../utils/format'
import { SayEditorDialog } from './SayEditorDialog'
import { SayEmptyState } from './SayEmptyState'
import { SayListItem } from './SayListItem'
import { SayListSkeleton } from './SayListSkeleton'

export function SaysRouteViewContent() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(readSaysPage(searchParams.get('page')))
  const [editingSay, setEditingSay] = useState<SayModel | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const searchParamsKey = searchParams.toString()

  useLayoutEffect(() => {
    const nextPage = readSaysPage(searchParams.get('page'))

    setPage((value) => (value === nextPage ? value : nextPage))
  }, [searchParamsKey])

  const saysQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getSays({ page, size: saysPageSize }),
    queryKey: ['says', 'list', page, saysPageSize],
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSay,
    onSuccess: async () => {
      toast.success(t('says.deleteSuccess'))
      await queryClient.invalidateQueries({ queryKey: ['says'] })
    },
  })

  const openCreate = () => {
    setEditingSay(null)
    setIsEditorOpen(true)
  }

  const openEdit = (say: SayModel) => {
    setEditingSay(say)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setEditingSay(null)
    setIsEditorOpen(false)
  }

  const says = saysQuery.data?.data ?? []
  const pagination = saysQuery.data?.pagination

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (page > 1) nextParams.set('page', String(page))
    if (nextParams.toString() !== searchParamsKey) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [page, searchParamsKey, setSearchParams])

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
            <Quote aria-hidden="true" className="size-4" />
            {t('says.title')}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {pagination
              ? t('says.countLabel', { count: pagination.total })
              : t('common.loading')}
          </span>
          <Button onClick={openCreate} type="button" variant="subtle">
            <Plus aria-hidden="true" className="size-4" />
            {t('says.addOne')}
          </Button>
        </div>
      </div>

      <Scroll className="flex-1">
        {saysQuery.isLoading && says.length === 0 ? (
          <SayListSkeleton />
        ) : says.length === 0 ? (
          <SayEmptyState onCreate={openCreate} />
        ) : (
          <div className="mx-auto max-w-5xl">
            {says.map((say) => (
              <SayListItem
                key={say.id}
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={() => openEdit(say)}
                say={say}
              />
            ))}
          </div>
        )}
      </Scroll>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex shrink-0 justify-center border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <CompactPagination
            onPageChange={setPage}
            onPageSizeChange={() => undefined}
            page={page}
            pageCount={pagination.totalPages}
            pageSize={saysPageSize}
            pageSizes={[saysPageSize]}
          />
        </div>
      ) : null}

      <SayEditorDialog
        onClose={closeEditor}
        onSuccess={async () => {
          await queryClient.invalidateQueries({ queryKey: ['says'] })
          closeEditor()
        }}
        open={isEditorOpen}
        say={editingSay}
      />
    </section>
  )
}
