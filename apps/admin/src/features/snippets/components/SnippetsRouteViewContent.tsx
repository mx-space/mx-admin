import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Import, PackagePlus, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import type { SnippetModel } from '~/models/snippet'
import type { SelectedSnippetId } from '../types/snippets'

import { getDependencyInstallUrl } from '~/api/dependencies'
import {
  deleteSnippet,
  getSnippetById,
  getSnippetGroups,
  getSnippets,
  resetFunctionSnippet,
} from '~/api/snippets'
import { SnippetType } from '~/models/snippet'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/ui/layout'
import { MasterDetailLayout } from '~/ui/page-layout'
import { Scroll } from '~/ui/scroll'
import { SelectField } from '~/ui/select'
import { TerminalOutputDialog } from '~/ui/terminal-output-dialog'

import {
  emptySnippet,
  snippetPageSize,
  snippetsQueryKey,
  snippetTypes,
} from '../constants'
import { getErrorMessage, readSnippetTypeFilter } from '../utils/snippets'
import { CompiledCodeModal } from './CompiledCodeModal'
import { FunctionLogsDrawer } from './FunctionLogsDrawer'
import { GroupFilter } from './GroupFilter'
import { ImportSnippetModal } from './ImportSnippetModal'
import { InstallDependencyModal } from './InstallDependencyModal'
import { SnippetEditor } from './SnippetEditor'
import { SnippetList } from './SnippetList'
import {
  SnippetDetailEmpty,
  SnippetDetailLoading,
  SnippetEmpty,
  SnippetSkeleton,
} from './SnippetStates'
import { UpdateDependenciesModal } from './UpdateDependenciesModal'

export function SnippetsRouteViewContent() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const [selectedId, setSelectedId] = useState<SelectedSnippetId>(
    searchParams.get('id'),
  )
  const [typeFilter, setTypeFilter] = useState<SnippetType | ''>(
    readSnippetTypeFilter(searchParams.get('type')),
  )
  const [referenceFilter, setReferenceFilter] = useState(
    searchParams.get('reference') ?? '',
  )
  const [importOpen, setImportOpen] = useState(false)
  const [installOpen, setInstallOpen] = useState(false)
  const [installInitialPackages, setInstallInitialPackages] = useState('')
  const [dependenciesOpen, setDependenciesOpen] = useState(false)
  const [compiledOpen, setCompiledOpen] = useState(false)
  const [logsOpen, setLogsOpen] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState<{
    onFinish?: () => void
    title: string
    url: string
  } | null>(null)
  const [showDetailOnMobile, setShowDetailOnMobile] = useState(false)

  useLayoutEffect(() => {
    const nextId = searchParams.get('id')
    const nextType = readSnippetTypeFilter(searchParams.get('type'))
    const nextReference = searchParams.get('reference') ?? ''

    setSelectedId((value) => (value === nextId ? value : nextId))
    setTypeFilter((value) => (value === nextType ? value : nextType))
    setReferenceFilter((value) =>
      value === nextReference ? value : nextReference,
    )
    setShowDetailOnMobile(Boolean(nextId))
  }, [searchParamsKey])

  useEffect(() => {
    const nextId = selectedId && selectedId !== 'new' ? selectedId : null

    const next = new URLSearchParams(searchParams)
    if (nextId) next.set('id', nextId)
    else next.delete('id')
    if (typeFilter) next.set('type', typeFilter)
    else next.delete('type')
    if (referenceFilter) next.set('reference', referenceFilter)
    else next.delete('reference')

    if (next.toString() === searchParamsKey) return

    setSearchParams(next, { replace: true })
  }, [
    referenceFilter,
    searchParams,
    searchParamsKey,
    selectedId,
    setSearchParams,
    typeFilter,
  ])

  const snippetsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      getSnippets({
        page: 1,
        reference: referenceFilter || undefined,
        size: snippetPageSize,
        type: typeFilter || undefined,
      }),
    queryKey: [...snippetsQueryKey, 'list', typeFilter, referenceFilter],
  })

  const groupsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getSnippetGroups({ page: 1, size: 50 }),
    queryKey: [...snippetsQueryKey, 'groups'],
  })

  const detailQuery = useQuery({
    enabled: Boolean(selectedId && selectedId !== 'new'),
    queryFn: () => getSnippetById(String(selectedId)),
    queryKey: [...snippetsQueryKey, 'detail', selectedId],
  })

  const snippets = snippetsQuery.data?.data ?? []
  const selectedSnippet = useMemo(
    () =>
      detailQuery.data ??
      snippets.find((snippet) => snippet.id === selectedId) ??
      null,
    [detailQuery.data, selectedId, snippets],
  )

  const invalidateSnippets = async () => {
    await queryClient.invalidateQueries({ queryKey: snippetsQueryKey })
  }

  const deleteMutation = useMutation({
    mutationFn: deleteSnippet,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('片段已删除')
      setSelectedId(null)
      setShowDetailOnMobile(false)
      await invalidateSnippets()
    },
  })

  const resetMutation = useMutation({
    mutationFn: resetFunctionSnippet,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '重置失败')),
    onSuccess: async () => {
      toast.success('函数片段已重置')
      await invalidateSnippets()
    },
  })

  const selectedFunction =
    selectedSnippet?.type === SnippetType.Function ? selectedSnippet : null

  const selectSnippet = (snippet: SnippetModel) => {
    setSelectedId(snippet.id)
    setShowDetailOnMobile(true)
  }

  const startCreate = () => {
    setSelectedId('new')
    setShowDetailOnMobile(true)
  }

  return (
    <>
      <MasterDetailLayout
        defaultSize={0.38}
        list={
          <section className="flex h-full min-h-0 flex-col border-r border-neutral-200 dark:border-neutral-800">
            <div
              className={cn(
                'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
                APP_SHELL_HEADER_HEIGHT_CLASS,
              )}
            >
              <div className="min-w-0">
                <h2 className="text-sm font-medium">配置与云函数</h2>
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {snippetsQuery.data?.pagination.total ?? 0} 个
              </span>
              <div className="flex items-center gap-2">
                <Button onClick={startCreate} type="button" variant="subtle">
                  <Plus aria-hidden="true" className="size-4" />
                  新建
                </Button>
                <Button
                  disabled={snippetsQuery.isFetching}
                  onClick={() => void snippetsQuery.refetch()}
                  type="button"
                  variant="subtle"
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={cn(
                      'size-4',
                      snippetsQuery.isFetching && 'animate-spin',
                    )}
                  />
                  刷新
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 border-b border-neutral-200 p-3 sm:grid-cols-2 dark:border-neutral-800">
              <Button
                onClick={() => setImportOpen(true)}
                type="button"
                variant="subtle"
              >
                <Import aria-hidden="true" className="size-4" />
                下载扩展包
              </Button>
              <Button
                onClick={() => setDependenciesOpen(true)}
                type="button"
                variant="subtle"
              >
                <PackagePlus aria-hidden="true" className="size-4" />
                更新依赖
              </Button>
            </div>

            <div className="grid gap-2 border-b border-neutral-200 p-3 dark:border-neutral-800">
              <SelectField
                aria-label="片段类型筛选"
                onValueChange={setTypeFilter}
                options={[
                  { label: '全部类型', value: '' },
                  ...snippetTypes.map((type) => ({ label: type, value: type })),
                ]}
                value={typeFilter}
              />
              <GroupFilter
                groups={groupsQuery.data?.data ?? []}
                loading={groupsQuery.isLoading}
                onSelect={(reference) => setReferenceFilter(reference)}
                selectedReference={referenceFilter}
              />
            </div>

            <Scroll className="flex-1">
              {snippetsQuery.isLoading && snippets.length === 0 ? (
                <SnippetSkeleton />
              ) : snippets.length === 0 ? (
                <SnippetEmpty />
              ) : (
                <SnippetList
                  onSelect={selectSnippet}
                  selectedId={selectedId}
                  snippets={snippets}
                />
              )}
            </Scroll>
          </section>
        }
        showDetailOnMobile={showDetailOnMobile}
        detail={
          <section className="h-full min-h-0">
            {selectedId === 'new' ? (
              <SnippetEditor
                initialValue={emptySnippet}
                mode="create"
                onBack={() => setShowDetailOnMobile(false)}
                onSaved={(snippet) => {
                  setSelectedId(snippet.id)
                  void invalidateSnippets()
                }}
              />
            ) : selectedSnippet ? (
              <SnippetEditor
                deleting={deleteMutation.isPending}
                initialValue={selectedSnippet}
                mode="edit"
                onBack={() => setShowDetailOnMobile(false)}
                onDelete={(snippet) => {
                  if (window.confirm(`确认删除「${snippet.name}」？`)) {
                    deleteMutation.mutate(snippet.id)
                  }
                }}
                onInstallDependency={() => {
                  setInstallInitialPackages('')
                  setInstallOpen(true)
                }}
                onOpenCompiled={() => setCompiledOpen(true)}
                onOpenLogs={() => setLogsOpen(true)}
                onReset={(snippet) => {
                  if (window.confirm(`确认重置内置函数「${snippet.name}」？`)) {
                    resetMutation.mutate(snippet.id)
                  }
                }}
                onSaved={(snippet) => {
                  setSelectedId(snippet.id)
                  void invalidateSnippets()
                }}
                resetting={resetMutation.isPending}
              />
            ) : detailQuery.isFetching ? (
              <SnippetDetailLoading />
            ) : (
              <SnippetDetailEmpty />
            )}
          </section>
        }
      />

      <ImportSnippetModal
        onClose={() => setImportOpen(false)}
        onImported={(packages) => {
          void invalidateSnippets()
          setShowDetailOnMobile(false)
          if (packages.length > 0) {
            setInstallInitialPackages(packages.join('\n'))
            setInstallOpen(true)
          }
        }}
        open={importOpen}
      />
      <InstallDependencyModal
        initialPackages={installInitialPackages}
        onInstall={(packages) => {
          setTerminalOutput({
            onFinish: () => toast.success('依赖安装完成'),
            title: '安装依赖',
            url: getDependencyInstallUrl(packages),
          })
        }}
        onClose={() => {
          setInstallOpen(false)
          setInstallInitialPackages('')
        }}
        open={installOpen}
      />
      <UpdateDependenciesModal
        onInstall={(packageName, onFinish) => {
          setTerminalOutput({
            onFinish: () => {
              toast.success('依赖更新完成')
              onFinish?.()
            },
            title: `更新依赖：${packageName}`,
            url: getDependencyInstallUrl(packageName),
          })
        }}
        onClose={() => setDependenciesOpen(false)}
        open={dependenciesOpen}
      />
      <CompiledCodeModal
        onClose={() => setCompiledOpen(false)}
        open={compiledOpen}
        snippet={selectedFunction}
      />
      <FunctionLogsDrawer
        onClose={() => setLogsOpen(false)}
        open={logsOpen}
        snippet={selectedFunction}
      />
      <TerminalOutputDialog
        onClose={() => setTerminalOutput(null)}
        onFinish={terminalOutput?.onFinish}
        open={Boolean(terminalOutput)}
        title={terminalOutput?.title ?? '终端输出'}
        url={terminalOutput?.url ?? null}
      />
    </>
  )
}
