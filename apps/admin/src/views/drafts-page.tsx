import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  ChevronLeft,
  Code2,
  FileText,
  GitCompare,
  Inbox,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type {
  DraftHistoryListItem,
  DraftModel,
  DraftRefType,
} from '~/models/draft'
import type { SerializedEditorState } from 'lexical'
import type { LucideIcon } from 'lucide-react'

import { DraftRefType as DraftRefTypeValue } from '~/models/draft'
import { relativeTimeFromNow } from '~/utils/time'

import {
  deleteDraft,
  getDraftHistory,
  getDraftHistoryVersion,
  getDrafts,
  restoreDraftVersion,
} from '../api/drafts'
import { Button, ButtonLink } from '../ui/button'
import { cn } from '../ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { MasterDetailLayout } from '../ui/page-layout'
import { Scroll } from '../ui/scroll'

const draftsQueryKey = ['drafts']
let diffHighlighterReady: Promise<void> | null = null
type DiffRendererInstance = {
  cleanUp: () => void
  render: (props: {
    containerWrapper: HTMLElement
    newFile: { contents: string; name: string }
    oldFile: { contents: string; name: string }
  }) => boolean | void
}

const filterOptions: Array<{ label: string; value: DraftRefType | 'all' }> = [
  { label: '全部', value: 'all' },
  { label: '文章', value: DraftRefTypeValue.Post },
  { label: '手记', value: DraftRefTypeValue.Note },
  { label: '页面', value: DraftRefTypeValue.Page },
]

const refTypeMeta: Record<
  DraftRefType,
  { className: string; icon: LucideIcon; label: string }
> = {
  [DraftRefTypeValue.Post]: {
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
    icon: Code2,
    label: '文章',
  },
  [DraftRefTypeValue.Note]: {
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
    icon: BookOpen,
    label: '手记',
  },
  [DraftRefTypeValue.Page]: {
    className:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300',
    icon: FileText,
    label: '页面',
  },
}

export function DraftsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const initialType = parseDraftFilterType(searchParams.get('type'))
  const [filterType, setFilterType] = useState<DraftRefType | 'all'>(
    initialType,
  )
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get('id'),
  )
  const [selectedDraftSnapshot, setSelectedDraftSnapshot] =
    useState<DraftModel | null>(null)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false)

  const draftsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      getDrafts({
        page: 1,
        refType: filterType === 'all' ? undefined : filterType,
        size: 50,
      }),
    queryKey: [...draftsQueryKey, 'list', filterType],
  })

  const drafts = draftsQuery.data?.data ?? []
  const selectedDraft = useMemo(() => {
    if (!selectedId) return null
    const fromList = drafts.find((draft) => draft.id === selectedId)
    if (fromList) return fromList
    if (selectedDraftSnapshot?.id === selectedId) return selectedDraftSnapshot
    return null
  }, [drafts, selectedDraftSnapshot, selectedId])

  useLayoutEffect(() => {
    const nextType = parseDraftFilterType(searchParams.get('type'))
    const nextSelectedId = searchParams.get('id')

    setFilterType((value) => (value === nextType ? value : nextType))
    setSelectedId((value) =>
      value === nextSelectedId ? value : nextSelectedId,
    )
    setShowDetailOnMobile(Boolean(nextSelectedId))
    if (!nextSelectedId) setSelectedDraftSnapshot(null)
  }, [searchParamsKey])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)

    if (filterType === 'all') {
      nextParams.delete('type')
    } else {
      nextParams.set('type', filterType)
    }

    if (selectedId) {
      nextParams.set('id', selectedId)
    } else {
      nextParams.delete('id')
    }

    if (nextParams.toString() !== searchParamsKey) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [filterType, searchParams, searchParamsKey, selectedId, setSearchParams])

  const deleteMutation = useMutation({
    mutationFn: deleteDraft,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('草稿已删除')
      setSelectedId(null)
      setSelectedDraftSnapshot(null)
      setShowDetailOnMobile(false)
      await queryClient.invalidateQueries({ queryKey: draftsQueryKey })
    },
  })

  const handleSelect = (draft: DraftModel) => {
    setSelectedId(draft.id)
    setSelectedDraftSnapshot({ ...draft })
    setShowDetailOnMobile(true)
  }

  const handleFilterChange = (value: DraftRefType | 'all') => {
    setFilterType(value)
    setSelectedId(null)
    setSelectedDraftSnapshot(null)
    setShowDetailOnMobile(false)
  }

  return (
    <MasterDetailLayout
      defaultSize={36}
      list={
        <section className="flex h-full min-h-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
          <div
            className={cn(
              'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
              APP_SHELL_HEADER_HEIGHT_CLASS,
            )}
          >
            <div className="min-w-0">
              <h2 className="text-sm font-medium">草稿箱</h2>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {draftsQuery.data?.pagination.total ?? 0} 个
            </span>
            <div className="flex items-center gap-2">
              <Button
                className="h-8 px-2.5"
                disabled={draftsQuery.isFetching}
                onClick={() => void draftsQuery.refetch()}
                type="button"
                variant="subtle"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn(
                    'size-4',
                    draftsQuery.isFetching && 'animate-spin',
                  )}
                />
                刷新
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <ButtonLink className="h-8 px-2.5 text-xs" to="/posts/edit">
              新建文章
            </ButtonLink>
            <ButtonLink
              className="h-8 px-2.5 text-xs"
              to="/notes/edit"
              variant="subtle"
            >
              新建手记
            </ButtonLink>
            <ButtonLink
              className="h-8 px-2.5 text-xs"
              to="/pages/edit"
              variant="subtle"
            >
              新建页面
            </ButtonLink>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            {filterOptions.map((option) => (
              <button
                className={cn(
                  'rounded border px-2.5 py-1 text-xs transition-colors',
                  filterType === option.value
                    ? 'border-neutral-950 bg-neutral-950 text-white dark:border-neutral-50 dark:bg-neutral-50 dark:text-neutral-950'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900',
                )}
                key={option.value}
                onClick={() => handleFilterChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

          <Scroll className="flex-1">
            {draftsQuery.isLoading && drafts.length === 0 ? (
              <DraftListSkeleton />
            ) : drafts.length === 0 ? (
              <DraftListEmpty />
            ) : (
              drafts.map((draft) => (
                <DraftRow
                  draft={draft}
                  key={draft.id}
                  onSelect={() => handleSelect(draft)}
                  selected={selectedDraft?.id === draft.id}
                />
              ))
            )}
          </Scroll>
        </section>
      }
      showDetailOnMobile={showDetailOnMobile}
      detail={
        <section className="h-full min-h-0">
          {selectedDraft ? (
            <DraftDetail
              deleting={deleteMutation.isPending}
              draft={selectedDraft}
              onBack={() => setShowDetailOnMobile(false)}
              onDelete={(draft) => {
                if (
                  window.confirm(`确认删除「${draft.title || '无标题'}」？`)
                ) {
                  deleteMutation.mutate(draft.id)
                }
              }}
            />
          ) : (
            <DraftDetailEmpty />
          )}
        </section>
      }
    />
  )
}

function DraftRow(props: {
  draft: DraftModel
  onSelect: () => void
  selected: boolean
}) {
  const meta = refTypeMeta[props.draft.refType]
  const Icon = meta.icon

  return (
    <button
      className={cn(
        'flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-neutral-800/50',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      type="button"
    >
      <span
        className={cn(
          'mt-0.5 inline-flex shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs',
          meta.className,
        )}
      >
        <Icon aria-hidden="true" className="size-3" />
        {meta.label}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {props.draft.title || '无标题'}
          </h3>
          <span className="text-xs tabular-nums text-neutral-400">
            v{props.draft.version}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span>{props.draft.refId ? '编辑中' : '新建'}</span>
          <span>{props.draft.contentFormat ?? 'markdown'}</span>
          <time dateTime={props.draft.updatedAt}>
            {relativeTimeFromNow(props.draft.updatedAt)}
          </time>
        </div>
      </div>
    </button>
  )
}

function DraftDetail(props: {
  deleting: boolean
  draft: DraftModel
  onBack: () => void
  onDelete: (draft: DraftModel) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const historyQuery = useQuery({
    enabled: Boolean(props.draft.id),
    queryFn: () => getDraftHistory(props.draft.id),
    queryKey: [...draftsQueryKey, 'history', props.draft.id],
  })
  const meta = refTypeMeta[props.draft.refType]
  const editPath = getEditPathForDraft(props.draft)
  const versionItems = useMemo(
    () => buildVersionItems(props.draft, historyQuery.data),
    [historyQuery.data, props.draft],
  )
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)

  useEffect(() => {
    const previousVersion = versionItems.find((item) => !item.isCurrent)
    setSelectedVersion(previousVersion?.version ?? null)
  }, [props.draft.id, versionItems])

  const selectedVersionItem = versionItems.find(
    (item) => item.version === selectedVersion,
  )
  const selectedVersionQuery = useQuery({
    enabled: selectedVersion != null && selectedVersion !== props.draft.version,
    queryFn: () => getDraftHistoryVersion(props.draft.id, selectedVersion!),
    queryKey: [
      ...draftsQueryKey,
      'history-version',
      props.draft.id,
      selectedVersion,
    ],
  })
  const selectedVersionDraft =
    selectedVersion === props.draft.version
      ? props.draft
      : selectedVersionQuery.data
  const diffStats =
    selectedVersionDraft && selectedVersion !== null
      ? computeDiffStats(selectedVersionDraft, props.draft)
      : null
  const restoreMutation = useMutation({
    mutationFn: (version: number) =>
      restoreDraftVersion(props.draft.id, version),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '恢复失败')),
    onSuccess: async () => {
      toast.success('版本已恢复')
      await queryClient.invalidateQueries({ queryKey: draftsQueryKey })
    },
  })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Button
            aria-label="返回草稿列表"
            className="h-8 px-2 lg:hidden"
            onClick={props.onBack}
            type="button"
            variant="subtle"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-neutral-950 dark:text-neutral-50">
              {props.draft.title || '无标题'}
            </h2>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span>{meta.label}</span>
              <span>v{props.draft.version}</span>
              <time dateTime={props.draft.updatedAt}>
                {relativeTimeFromNow(props.draft.updatedAt)}
              </time>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            className="h-8 px-2.5"
            onClick={() => navigate(editPath)}
            type="button"
            variant="subtle"
          >
            <Pencil aria-hidden="true" className="size-4" />
            编辑
          </Button>
          <Button
            className="h-8 border-red-200 px-2.5 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
            disabled={props.deleting}
            onClick={() => props.onDelete(props.draft)}
            type="button"
            variant="subtle"
          >
            {props.deleting ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" className="size-4" />
            )}
            删除
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {historyQuery.isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2
              aria-hidden="true"
              className="size-5 animate-spin text-neutral-400"
            />
          </div>
        ) : versionItems.length === 0 ? (
          <DraftDetailEmpty />
        ) : (
          <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="min-h-0 border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
              <div className="flex h-10 items-center gap-2 border-b border-neutral-200 px-4 text-sm font-medium text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
                <GitCompare aria-hidden="true" className="size-4" />
                版本列表
                <span className="text-xs font-normal text-neutral-400">
                  ({versionItems.length})
                </span>
              </div>
              <Scroll className="max-h-72 lg:h-[calc(100%-2.5rem)] lg:max-h-none">
                {versionItems.map((item) => (
                  <VersionRow
                    diffStats={
                      item.version === selectedVersion ? diffStats : null
                    }
                    item={item}
                    key={item.version}
                    onRestore={() => restoreMutation.mutate(item.version)}
                    onSelect={() => setSelectedVersion(item.version)}
                    restorePending={restoreMutation.isPending}
                    selected={selectedVersion === item.version}
                  />
                ))}
              </Scroll>
            </div>

            <div className="flex min-h-0 flex-col bg-neutral-50 dark:bg-neutral-950">
              <div className="flex h-10 shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  {selectedVersionItem ? (
                    <>
                      <span>v{selectedVersionItem.version}</span>
                      <span className="text-neutral-400">→</span>
                      <span>v{props.draft.version} 当前</span>
                    </>
                  ) : (
                    <span>选择一个历史版本查看差异</span>
                  )}
                </div>
                {diffStats && !diffStats.isSame ? (
                  <span className="text-xs tabular-nums text-neutral-500">
                    {diffStats.delta > 0
                      ? `+${diffStats.delta}`
                      : diffStats.delta}{' '}
                    字
                  </span>
                ) : null}
              </div>

              <Scroll className="flex-1" innerClassName="p-4">
                {selectedVersionQuery.isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2
                      aria-hidden="true"
                      className="size-5 animate-spin text-neutral-400"
                    />
                  </div>
                ) : selectedVersionDraft ? (
                  <DraftDiffPreview
                    currentDraft={props.draft}
                    diffStats={diffStats}
                    selectedDraft={selectedVersionDraft}
                  />
                ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    无法加载版本内容。
                  </p>
                )}
              </Scroll>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface VersionItem {
  baseVersion?: number
  isCurrent: boolean
  isFullSnapshot?: boolean
  refVersion?: number
  savedAt: string
  title: string
  version: number
}

function VersionRow(props: {
  diffStats: DraftDiffStats | null
  item: VersionItem
  onRestore: () => void
  onSelect: () => void
  restorePending: boolean
  selected: boolean
}) {
  return (
    <div
      className={cn(
        'group flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors dark:border-neutral-800/60',
        props.selected
          ? 'bg-neutral-100 dark:bg-neutral-900'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/70',
      )}
      onClick={props.onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          props.onSelect()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
            v{props.item.version}
          </span>
          {props.item.isCurrent ? (
            <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              当前
            </span>
          ) : null}
          {props.item.isFullSnapshot !== undefined ? (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              {props.item.isFullSnapshot ? '全量' : '增量'}
            </span>
          ) : null}
          {props.item.refVersion !== undefined ? (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              = v{props.item.refVersion}
            </span>
          ) : null}
        </div>
        <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
          {props.item.title || '无标题'} ·{' '}
          {relativeTimeFromNow(props.item.savedAt)}
        </p>
      </div>
      {props.diffStats ? (
        <span className="shrink-0 text-xs tabular-nums text-neutral-500">
          {props.diffStats.isSame
            ? '相同'
            : `${props.diffStats.delta > 0 ? '+' : ''}${props.diffStats.delta} 字`}
        </span>
      ) : null}
      {!props.item.isCurrent ? (
        <Button
          aria-label={`恢复版本 ${props.item.version}`}
          className="h-7 px-2 opacity-0 transition-opacity group-hover:opacity-100"
          disabled={props.restorePending}
          onClick={(event) => {
            event.stopPropagation()
            props.onRestore()
          }}
          type="button"
          variant="subtle"
        >
          {props.restorePending ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <RotateCcw aria-hidden="true" className="size-3.5" />
          )}
        </Button>
      ) : null}
    </div>
  )
}

interface DraftDiffStats {
  delta: number
  isSame: boolean
}

function DraftDiffPreview(props: {
  currentDraft: DraftModel
  diffStats: DraftDiffStats | null
  selectedDraft: DraftModel
}) {
  if (
    props.selectedDraft.contentFormat === 'lexical' &&
    props.currentDraft.contentFormat === 'lexical' &&
    props.selectedDraft.content &&
    props.currentDraft.content
  ) {
    return (
      <RichDraftDiffPanel
        currentContent={props.currentDraft.content}
        currentVersion={props.currentDraft.version}
        selectedContent={props.selectedDraft.content}
        selectedVersion={props.selectedDraft.version}
      />
    )
  }

  const selectedText = getDraftTextForDiff(props.selectedDraft)
  const currentText = getDraftTextForDiff(props.currentDraft)

  if (props.diffStats?.isSame) {
    return (
      <div className="flex min-h-[20rem] flex-col items-center justify-center text-center">
        <GitCompare aria-hidden="true" className="size-8 text-neutral-300" />
        <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          与当前版本内容相同
        </p>
      </div>
    )
  }

  return (
    <MarkdownDraftDiffPanel
      currentText={currentText}
      currentVersion={props.currentDraft.version}
      selectedText={selectedText}
      selectedVersion={props.selectedDraft.version}
    />
  )
}

function RichDraftDiffPanel(props: {
  currentContent: string
  currentVersion: number
  selectedContent: string
  selectedVersion: number
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const selectedValue = useMemo(
    () => parseSerializedDraftContent(props.selectedContent),
    [props.selectedContent],
  )
  const currentValue = useMemo(
    () => parseSerializedDraftContent(props.currentContent),
    [props.currentContent],
  )

  useEffect(() => {
    if (!containerRef.current || !selectedValue || !currentValue) return

    let disposed = false
    let handle: { unmount: () => void } | null = null

    void import('../rich-editor/mount/mount-rich-diff').then(
      ({ mountRichDiff }) => {
        if (disposed || !containerRef.current) return
        handle = mountRichDiff(containerRef.current, {
          className: '!rounded-none !border-0',
          newValue: currentValue,
          oldValue: selectedValue,
          theme: getCurrentColorScheme(),
          variant: 'comment',
        })
      },
    )

    return () => {
      disposed = true
      handle?.unmount()
    }
  }, [currentValue, selectedValue])

  if (!selectedValue || !currentValue) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center border border-dashed border-neutral-200 bg-white text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        富文本内容解析失败。
      </div>
    )
  }

  return (
    <section className="min-h-full min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
          富文本差异
        </h3>
        <span className="shrink-0 text-xs tabular-nums text-neutral-500">
          v{props.selectedVersion} → v{props.currentVersion}
        </span>
      </div>
      <Scroll
        className="min-h-[20rem] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
        orientation="both"
        viewportClassName="min-h-[20rem]"
      >
        <div className="min-h-[20rem]" ref={containerRef} />
      </Scroll>
    </section>
  )
}

function MarkdownDraftDiffPanel(props: {
  currentText: string
  currentVersion: number
  selectedText: string
  selectedVersion: number
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    let disposed = false
    let diffInstance: DiffRendererInstance | null = null

    setIsLoading(true)
    setHasError(false)
    containerRef.current.innerHTML = ''

    void import('@pierre/diffs')
      .then(async ({ FileDiff, preloadHighlighter }) => {
        await ensureDiffHighlighter(preloadHighlighter)

        if (disposed || !containerRef.current) return

        setIsLoading(false)
        const nextDiffInstance = new FileDiff({
          diffIndicators: 'bars',
          diffStyle: 'unified',
          disableFileHeader: true,
          themeType: 'system',
        }) as unknown as DiffRendererInstance
        nextDiffInstance.render({
          containerWrapper: containerRef.current,
          newFile: {
            contents: props.currentText,
            name: `v${props.currentVersion}.md`,
          },
          oldFile: {
            contents: props.selectedText,
            name: `v${props.selectedVersion}.md`,
          },
        })
        diffInstance = nextDiffInstance
      })
      .catch((error: unknown) => {
        console.error('[DraftsPage] Failed to render markdown diff:', error)
        if (!disposed) {
          setHasError(true)
          setIsLoading(false)
        }
      })

    return () => {
      disposed = true
      diffInstance?.cleanUp()
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [
    props.currentText,
    props.currentVersion,
    props.selectedText,
    props.selectedVersion,
  ])

  return (
    <section className="min-h-full min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
          Markdown 差异
        </h3>
        <span className="shrink-0 text-xs tabular-nums text-neutral-500">
          v{props.selectedVersion} → v{props.currentVersion}
        </span>
      </div>
      <Scroll
        className="relative min-h-[20rem] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
        orientation="both"
        viewportClassName="min-h-[20rem]"
      >
        <div className="min-h-[20rem]" ref={containerRef} />
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-neutral-500 backdrop-blur-sm dark:bg-neutral-950/80 dark:text-neutral-400">
            加载差异视图...
          </div>
        ) : null}
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white text-sm text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">
            Markdown 差异渲染失败。
          </div>
        ) : null}
        {!isLoading &&
        !hasError &&
        !props.selectedText &&
        !props.currentText ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
            无正文内容。
          </div>
        ) : null}
      </Scroll>
    </section>
  )
}

function ensureDiffHighlighter(
  preloadHighlighter: typeof import('@pierre/diffs').preloadHighlighter,
) {
  diffHighlighterReady ??= preloadHighlighter({
    langs: ['markdown', 'json', 'typescript', 'javascript', 'html', 'css'],
    themes: ['github-dark', 'github-light'],
  })
  return diffHighlighterReady
}

function buildVersionItems(
  draft: DraftModel,
  history: DraftHistoryListItem[] | undefined,
): VersionItem[] {
  const currentSavedAt = draft.updatedAt || draft.createdAt
  const currentItem: VersionItem = {
    isCurrent: true,
    savedAt: currentSavedAt,
    title: draft.title,
    version: draft.version,
  }
  const historyItems = (history ?? [])
    .filter((item) => item.version !== draft.version)
    .map((item) => ({
      baseVersion: item.baseVersion,
      isCurrent: false,
      isFullSnapshot: item.isFullSnapshot,
      refVersion: item.refVersion,
      savedAt: item.savedAt,
      title: item.title,
      version: item.version,
    }))

  return [currentItem, ...historyItems].sort((a, b) => b.version - a.version)
}

function computeDiffStats(
  selectedDraft: DraftModel,
  currentDraft: DraftModel,
): DraftDiffStats {
  const selectedText = getDraftTextForDiff(selectedDraft)
  const currentText = getDraftTextForDiff(currentDraft)

  return {
    delta: currentText.length - selectedText.length,
    isSame: selectedText === currentText,
  }
}

function getDraftTextForDiff(draft: DraftModel) {
  if (draft.contentFormat === 'lexical' && draft.content) {
    return draft.text || draft.content
  }

  return draft.text || draft.content || ''
}

function parseSerializedDraftContent(
  content: string,
): SerializedEditorState | null {
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && 'root' in parsed) {
      return parsed as SerializedEditorState
    }
  } catch {
    return null
  }

  return null
}

function getCurrentColorScheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function getEditPathForDraft(draft: DraftModel) {
  const basePath =
    draft.refType === DraftRefTypeValue.Post
      ? '/posts/edit'
      : draft.refType === DraftRefTypeValue.Note
        ? '/notes/edit'
        : '/pages/edit'
  const params = new URLSearchParams()
  params.set('draftId', draft.id)
  if (draft.refId) params.set('id', draft.refId)

  return `${basePath}?${params.toString()}`
}

function parseDraftFilterType(value: string | null): DraftRefType | 'all' {
  if (
    value === DraftRefTypeValue.Post ||
    value === DraftRefTypeValue.Note ||
    value === DraftRefTypeValue.Page
  ) {
    return value
  }

  return 'all'
}

function DraftListSkeleton() {
  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {Array.from({ length: 8 }).map((_, index) => (
        <div className="px-4 py-3" key={index}>
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
          <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      ))}
    </div>
  )
}

function DraftListEmpty() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <Inbox aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        暂无草稿
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        草稿会在编辑时自动保存到这里。
      </p>
    </div>
  )
}

function DraftDetailEmpty() {
  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <Inbox aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        选择一个草稿查看详情。
      </p>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
