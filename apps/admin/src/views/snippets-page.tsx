import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Code2,
  Download,
  ExternalLink,
  FileText,
  Import,
  Loader2,
  PackagePlus,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ScrollText,
  Trash2,
  X,
} from 'lucide-react'
import {
  FormEvent,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { useSearchParams } from 'react-router'
import { dump, load } from 'js-yaml'
import JSON5 from 'json5'
import { toast } from 'sonner'
import type { SnippetModel } from '~/models/snippet'
import type { ServerlessLogEntry } from '../api/serverless'
import type { CreateSnippetData, SnippetGroup } from '../api/snippets'

import {
  defaultServerlessFunction,
  SnippetType,
  SnippetTypeToLanguage,
} from '~/models/snippet'
import { relativeTimeFromNow } from '~/utils/time'

import {
  getDependencyGraph,
  getDependencyInstallUrl,
  getNpmPackageLatest,
} from '../api/dependencies'
import { fetchGitHubSnippetTree, fetchGitHubText } from '../api/github-snippets'
import {
  getCompiledCode,
  getInvocationLogDetail,
  getInvocationLogs,
} from '../api/serverless'
import {
  createSnippet,
  deleteSnippet,
  getSnippetById,
  getSnippetGroups,
  getSnippets,
  importSnippets,
  resetFunctionSnippet,
  updateSnippet,
} from '../api/snippets'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../ui/cn'
import { CodeEditor } from '../ui/code-editor'
import { CompactPagination } from '../ui/compact-pagination'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { MasterDetailLayout } from '../ui/page-layout'
import { Scroll } from '../ui/scroll'
import { SelectField } from '../ui/select'
import { TerminalOutputDialog } from '../ui/terminal-output-dialog'
import { TextArea, TextInput } from '../ui/text-field'

const snippetsQueryKey = ['snippets']
const snippetPageSize = 100
const logPageSize = 20

const snippetTypes = [
  SnippetType.JSON,
  SnippetType.JSON5,
  SnippetType.YAML,
  SnippetType.Text,
  SnippetType.Function,
]

const emptySnippet: CreateSnippetData = {
  name: '',
  raw: '{}',
  reference: 'root',
  type: SnippetType.JSON,
}

type SelectedSnippetId = 'new' | string | null
type StatusFilter = 'all' | 'error' | 'success'

interface ImportFunctionPreview {
  htmlUrl?: string | null
  name: string
  raw: string
  reference: string
}

interface ImportPackagePreview {
  dependencies: string[]
  functions: ImportFunctionPreview[]
}

export function SnippetsPage() {
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

function GroupFilter(props: {
  groups: SnippetGroup[]
  loading: boolean
  onSelect: (reference: string) => void
  selectedReference: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        className={cn(
          'rounded px-2 py-1 text-xs transition-colors',
          props.selectedReference
            ? 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900'
            : 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-950',
        )}
        onClick={() => props.onSelect('')}
        type="button"
      >
        全部分组
      </button>
      {props.loading ? (
        <span className="px-2 py-1 text-xs text-neutral-400">加载中</span>
      ) : (
        props.groups.map((group) => (
          <button
            className={cn(
              'rounded px-2 py-1 text-xs transition-colors',
              props.selectedReference === group.reference
                ? 'bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-950'
                : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900',
            )}
            key={group.reference}
            onClick={() => props.onSelect(group.reference)}
            type="button"
          >
            {group.reference || 'root'}
            <span className="ml-1 opacity-70">{group.count}</span>
          </button>
        ))
      )}
    </div>
  )
}

function SnippetList(props: {
  onSelect: (snippet: SnippetModel) => void
  selectedId: SelectedSnippetId
  snippets: SnippetModel[]
}) {
  const groupedSnippets = useMemo(
    () => groupSnippetList(props.snippets),
    [props.snippets],
  )

  return (
    <div>
      {groupedSnippets.map((group) => (
        <div key={group.reference}>
          <div className="sticky top-0 z-10 border-b border-neutral-100 bg-neutral-50 px-4 py-2 text-xs font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            {group.reference || 'root'} · {group.snippets.length}
          </div>
          {group.snippets.map((snippet) => (
            <SnippetRow
              key={snippet.id}
              onSelect={() => props.onSelect(snippet)}
              selected={props.selectedId === snippet.id}
              snippet={snippet}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function SnippetRow(props: {
  onSelect: () => void
  selected: boolean
  snippet: SnippetModel
}) {
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
      <Code2 aria-hidden="true" className="mt-0.5 size-4 text-neutral-400" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
            {props.snippet.name || '未命名片段'}
          </h3>
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            {props.snippet.type}
          </span>
          {props.snippet.builtIn ? (
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              built-in
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span>{props.snippet.reference || 'root'}</span>
          <span>{props.snippet.private ? 'private' : 'public'}</span>
          {props.snippet.updatedAt ? (
            <time>{relativeTimeFromNow(props.snippet.updatedAt)}</time>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function SnippetEditor(props: {
  deleting?: boolean
  initialValue: CreateSnippetData | SnippetModel
  mode: 'create' | 'edit'
  onBack: () => void
  onDelete?: (snippet: SnippetModel) => void
  onInstallDependency?: () => void
  onOpenCompiled?: () => void
  onOpenLogs?: () => void
  onReset?: (snippet: SnippetModel) => void
  onSaved: (snippet: SnippetModel) => void
  resetting?: boolean
}) {
  const [form, setForm] = useState<CreateSnippetData>(() =>
    normalizeSnippet(props.initialValue),
  )

  useEffect(() => {
    setForm(normalizeSnippet(props.initialValue))
  }, [props.initialValue])

  const mutation = useMutation({
    mutationFn: () =>
      props.mode === 'create'
        ? createSnippet(prepareSnippetPayload(form))
        : updateSnippet(
            (props.initialValue as SnippetModel).id,
            prepareSnippetPayload(form),
          ),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存失败')),
    onSuccess: (snippet) => {
      toast.success('片段已保存')
      props.onSaved(snippet)
    },
  })

  const save = () => {
    if (!form.name.trim()) {
      toast.error('请填写片段名称')
      return
    }
    mutation.mutate()
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    save()
  }

  const editSnippet =
    props.mode === 'edit' ? (props.initialValue as SnippetModel) : null
  const isFunction = form.type === SnippetType.Function
  const isBuiltInFunction = Boolean(editSnippet?.builtIn && isFunction)
  const typeDisabled = Boolean(
    editSnippet && editSnippet.type === SnippetType.Function,
  )

  const changeType = (type: SnippetType) => {
    setForm((current) => ({
      ...current,
      ...getSnippetDefaultsForType(type, current.type, current.raw),
      type,
    }))
  }

  return (
    <form className="flex h-full min-h-0 flex-col" onSubmit={onSubmit}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Button
            aria-label="返回片段列表"
            className="h-8 px-2 lg:hidden"
            onClick={props.onBack}
            type="button"
            variant="subtle"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-neutral-950 dark:text-neutral-50">
              {props.mode === 'create' ? '新建片段' : form.name || '未命名片段'}
            </h2>
            <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
              {form.type} · {form.reference || 'root'}
            </p>
          </div>
        </div>
        <Scroll
          className="shrink-0"
          innerClassName="flex items-center gap-2"
          orientation="horizontal"
        >
          {isFunction && editSnippet ? (
            <>
              <Button
                className="h-8 px-2"
                onClick={props.onOpenCompiled}
                type="button"
                variant="subtle"
              >
                <FileText aria-hidden="true" className="size-4" />
                编译产物
              </Button>
              <Button
                className="h-8 px-2"
                onClick={props.onOpenLogs}
                type="button"
                variant="subtle"
              >
                <ScrollText aria-hidden="true" className="size-4" />
                调用日志
              </Button>
              <Button
                className="h-8 px-2"
                onClick={props.onInstallDependency}
                type="button"
                variant="subtle"
              >
                <Download aria-hidden="true" className="size-4" />
                安装依赖
              </Button>
            </>
          ) : null}
          {editSnippet?.builtIn && props.onReset ? (
            <Button
              className="h-8 px-2"
              disabled={props.resetting}
              onClick={() => props.onReset?.(editSnippet)}
              type="button"
              variant="subtle"
            >
              {props.resetting ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <RotateCcw aria-hidden="true" className="size-4" />
              )}
              重置
            </Button>
          ) : null}
          {editSnippet && props.onDelete ? (
            <Button
              className="h-8 border-red-200 px-2 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
              disabled={props.deleting}
              onClick={() => props.onDelete?.(editSnippet)}
              type="button"
              variant="subtle"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              删除
            </Button>
          ) : null}
          <Button
            className="h-8 px-2"
            disabled={mutation.isPending}
            type="submit"
          >
            {mutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            保存
          </Button>
        </Scroll>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <Scroll
          className="min-h-0 border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800"
          innerClassName="space-y-3 p-4"
        >
          <Field label="名称">
            <TextInput
              disabled={isBuiltInFunction}
              onChange={(name) => setForm((current) => ({ ...current, name }))}
              value={form.name}
            />
          </Field>
          <Field label="类型">
            <SelectField
              disabled={typeDisabled}
              onValueChange={changeType}
              options={snippetTypes.map((type) => ({
                label: type,
                value: type,
              }))}
              value={form.type}
            />
          </Field>
          <Field label="分组">
            <TextInput
              disabled={isBuiltInFunction}
              onChange={(reference) =>
                setForm((current) => ({ ...current, reference }))
              }
              value={form.reference ?? ''}
            />
          </Field>
          <Field label="注释">
            <TextInput
              onChange={(comment) =>
                setForm((current) => ({ ...current, comment }))
              }
              value={form.comment ?? ''}
            />
          </Field>
          <Field label="Metatype">
            <TextInput
              onChange={(metatype) =>
                setForm((current) => ({ ...current, metatype }))
              }
              value={form.metatype ?? ''}
            />
          </Field>
          <Checkbox
            checked={Boolean(form.private)}
            disabled={isBuiltInFunction}
            label="私有"
            onCheckedChange={(checked) =>
              setForm((current) => ({
                ...current,
                private: checked,
              }))
            }
          />
          {isFunction ? (
            <>
              <Checkbox
                checked={Boolean(form.enable)}
                disabled={isBuiltInFunction}
                label="启用函数"
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    enable: checked,
                  }))
                }
              />
              <Field label="Method">
                <TextInput
                  disabled={isBuiltInFunction}
                  onChange={(method) =>
                    setForm((current) => ({ ...current, method }))
                  }
                  value={form.method ?? ''}
                />
              </Field>
              <Field label="Path">
                <TextInput
                  onChange={(customPath) =>
                    setForm((current) => ({ ...current, customPath }))
                  }
                  value={form.customPath ?? ''}
                />
              </Field>
              <Field label="Secret">
                <TextArea
                  controlClassName="min-h-24 resize-y font-mono text-xs"
                  onChange={(secret) =>
                    setForm((current) => ({ ...current, secret }))
                  }
                  spellCheck={false}
                  value={serializeSnippetSecret(form.secret)}
                />
              </Field>
            </>
          ) : (
            <Field label="Schema">
              <TextArea
                controlClassName="min-h-24 resize-y font-mono text-xs"
                onChange={(schema) =>
                  setForm((current) => ({ ...current, schema }))
                }
                spellCheck={false}
                value={form.schema ?? ''}
              />
            </Field>
          )}
        </Scroll>

        <CodeEditorSurface
          language={SnippetTypeToLanguage[form.type]}
          onChange={(raw) => setForm((current) => ({ ...current, raw }))}
          onSave={save}
          value={form.raw}
        />
      </div>
    </form>
  )
}

function CodeEditorSurface(props: {
  language: string
  onChange: (value: string) => void
  onSave: () => void
  value: string
}) {
  return (
    <CodeEditor
      className="min-h-[32rem]"
      language={props.language}
      onChange={props.onChange}
      onSave={props.onSave}
      title={props.language}
      value={props.value}
    />
  )
}

function ImportSnippetModal(props: {
  onClose: () => void
  onImported: (packages: string[]) => void
  open: boolean
}) {
  const [name, setName] = useState('')
  const [processName, setProcessName] = useState('')
  const [functions, setFunctions] = useState<ImportFunctionPreview[]>([])
  const [dependencies, setDependencies] = useState<string[]>([])

  useEffect(() => {
    if (!props.open) {
      setName('')
      setProcessName('')
      setFunctions([])
      setDependencies([])
    }
  }, [props.open])

  const availableQuery = useQuery({
    enabled: props.open,
    queryFn: fetchAvailableSnippetPackages,
    queryKey: ['github-snippet-packages'],
  })

  const previewQuery = useQuery({
    enabled: props.open && Boolean(processName),
    queryFn: () => loadSnippetPackage(processName),
    queryKey: ['github-snippet-package', processName],
  })

  useEffect(() => {
    if (!previewQuery.data) return
    setFunctions(previewQuery.data.functions)
    setDependencies(previewQuery.data.dependencies)
  }, [previewQuery.data])

  const importMutation = useMutation({
    mutationFn: () =>
      importSnippets({
        packages: dependencies,
        snippets: functions.map((item) => ({
          name: basenameWithoutExt(item.name),
          private: false,
          raw: item.raw,
          reference: item.reference,
          type: SnippetType.Function,
        })),
      }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '导入失败')),
    onSuccess: () => {
      toast.success('导入成功')
      props.onImported(dependencies)
      props.onClose()
    },
  })

  const startProcess = () => {
    const nextName = name.trim()
    if (!nextName) {
      toast.error('请输入包名')
      return
    }
    setProcessName(nextName)
  }

  return (
    <Modal onClose={props.onClose} open={props.open} title="导入 Snippets">
      <div className="space-y-5">
        <div className="grid gap-3">
          <Field label="包名">
            <TextInput
              onChange={setName}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  startProcess()
                }
              }}
              placeholder="支持 mx-space/snippets 下的集合包，例如 kami"
              value={name}
            />
          </Field>
          <div className="flex justify-end">
            <Button onClick={startProcess} type="button">
              <Download aria-hidden="true" className="size-4" />
              处理
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium">可获取的扩展包</h3>
          <div className="mt-2 min-h-10">
            {availableQuery.isLoading ? (
              <InlineLoading label="正在从 GitHub 获取" />
            ) : availableQuery.data?.length ? (
              <div className="flex flex-wrap gap-2">
                {availableQuery.data.map((item) => (
                  <span
                    className="inline-flex items-center gap-1 rounded border border-neutral-200 text-sm dark:border-neutral-800"
                    key={item.name}
                  >
                    <button
                      className="px-2 py-1 text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
                      onClick={() => {
                        setName(item.name)
                        setProcessName(item.name)
                      }}
                      type="button"
                    >
                      {item.name}
                    </button>
                    {item.url ? (
                      <a
                        className="pr-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-100"
                        href={item.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink aria-hidden="true" className="size-3.5" />
                      </a>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">暂无可用包。</p>
            )}
          </div>
        </div>

        {processName ? (
          <div className="rounded border border-neutral-200 dark:border-neutral-800">
            <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <h3 className="text-sm font-medium">解析结果：{processName}</h3>
            </div>
            <div className="space-y-4 p-4">
              {previewQuery.isLoading ? (
                <InlineLoading label="正在解析扩展包" />
              ) : previewQuery.isError ? (
                <p className="text-sm text-red-600">
                  {getErrorMessage(previewQuery.error, '解析失败')}
                </p>
              ) : (
                <>
                  <PreviewTagList
                    items={functions}
                    label="将导入的函数"
                    onRemove={(index) =>
                      setFunctions((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    render={(item) => item.name}
                  />
                  <PreviewTagList
                    items={dependencies}
                    label="将安装的依赖"
                    onRemove={(index) =>
                      setDependencies((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    render={(item) => item}
                  />
                  <div className="flex justify-end">
                    <Button
                      disabled={
                        importMutation.isPending || functions.length === 0
                      }
                      onClick={() => importMutation.mutate()}
                      type="button"
                    >
                      {importMutation.isPending ? (
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                      ) : (
                        <Import aria-hidden="true" className="size-4" />
                      )}
                      导入
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

function PreviewTagList<TItem>(props: {
  items: TItem[]
  label: string
  onRemove: (index: number) => void
  render: (item: TItem) => string
}) {
  return (
    <div>
      <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {props.label}
      </h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {props.items.length === 0 ? (
          <span className="text-sm text-neutral-400">无</span>
        ) : (
          props.items.map((item, index) => (
            <span
              className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              key={`${props.render(item)}-${index}`}
            >
              {props.render(item)}
              <button
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-100"
                onClick={() => props.onRemove(index)}
                type="button"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  )
}

function InstallDependencyModal(props: {
  initialPackages: string
  onInstall: (packages: string[]) => void
  onClose: () => void
  open: boolean
}) {
  const [input, setInput] = useState(props.initialPackages)

  useEffect(() => {
    if (props.open) setInput(props.initialPackages)
  }, [props.initialPackages, props.open])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const packages = parsePackageInput(input)
    if (packages.length === 0) {
      toast.error('请输入依赖包名')
      return
    }
    props.onInstall(packages)
    props.onClose()
  }

  return (
    <Modal onClose={props.onClose} open={props.open} title="安装依赖">
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Package Name">
          <TextArea
            controlClassName="min-h-28 resize-y font-mono text-xs"
            onChange={setInput}
            placeholder="E.g. qs 或 qs@latest；多个依赖可用换行或逗号分隔"
            spellCheck={false}
            value={input}
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit">
            <Download aria-hidden="true" className="size-4" />
            安装
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function UpdateDependenciesModal(props: {
  onInstall: (packageName: string, onFinish?: () => void) => void
  onClose: () => void
  open: boolean
}) {
  const queryClient = useQueryClient()
  const graphQuery = useQuery({
    enabled: props.open,
    queryFn: getDependencyGraph,
    queryKey: ['dependencies', 'graph'],
  })
  const dependencies = Object.entries(graphQuery.data?.dependencies ?? {})
  const refreshDependencies = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dependencies'] }),
      graphQuery.refetch(),
    ])
  }

  return (
    <Modal onClose={props.onClose} open={props.open} title="依赖更新">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            disabled={graphQuery.isFetching}
            onClick={() => void graphQuery.refetch()}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn('size-4', graphQuery.isFetching && 'animate-spin')}
            />
            刷新
          </Button>
        </div>
        <div className="overflow-hidden rounded border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2 font-medium">包名</th>
                <th className="px-3 py-2 font-medium">版本</th>
                <th className="px-3 py-2 font-medium">最新</th>
                <th className="px-3 py-2 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {graphQuery.isLoading ? (
                <tr>
                  <td className="px-3 py-8 text-center" colSpan={4}>
                    <InlineLoading label="正在读取依赖图" />
                  </td>
                </tr>
              ) : dependencies.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-8 text-center text-neutral-500"
                    colSpan={4}
                  >
                    暂无依赖。
                  </td>
                </tr>
              ) : (
                dependencies.map(([name, version]) => (
                  <DependencyRow
                    currentVersion={version}
                    key={name}
                    name={name}
                    onUpdate={(packageName) =>
                      props.onInstall(packageName, () => {
                        void refreshDependencies()
                      })
                    }
                    open={props.open}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}

function DependencyRow(props: {
  currentVersion: string
  name: string
  onUpdate: (packageName: string) => void
  open: boolean
}) {
  const latestQuery = useQuery({
    enabled: props.open,
    queryFn: () => getNpmPackageLatest(props.name),
    queryKey: ['npm-latest', props.name],
    staleTime: 5 * 60 * 1000,
  })
  const latestVersion = latestQuery.data?.version

  return (
    <tr>
      <td className="max-w-72 px-3 py-2">
        <a
          className="break-all text-neutral-900 hover:underline dark:text-neutral-100"
          href={`https://npmjs.com/package/${props.name}`}
          rel="noreferrer"
          target="_blank"
        >
          {props.name}
        </a>
      </td>
      <td className="px-3 py-2 font-mono text-xs text-neutral-500">
        {props.currentVersion}
      </td>
      <td className="px-3 py-2 font-mono text-xs text-neutral-500">
        {latestQuery.isLoading ? '...' : (latestVersion ?? '获取失败')}
      </td>
      <td className="px-3 py-2 text-right">
        <Button
          disabled={!latestVersion}
          onClick={() => {
            if (latestVersion) props.onUpdate(`${props.name}@${latestVersion}`)
          }}
          type="button"
          variant="subtle"
        >
          更新
        </Button>
      </td>
    </tr>
  )
}

function CompiledCodeModal(props: {
  onClose: () => void
  open: boolean
  snippet: SnippetModel | null
}) {
  const query = useQuery({
    enabled: props.open && Boolean(props.snippet?.id),
    queryFn: () => getCompiledCode(String(props.snippet?.id)),
    queryKey: ['serverless', 'compiled', props.snippet?.id],
  })

  return (
    <Modal
      onClose={props.onClose}
      open={props.open}
      title={`编译产物${props.snippet?.name ? `：${props.snippet.name}` : ''}`}
    >
      {query.isLoading ? (
        <InlineLoading label="正在读取编译产物" />
      ) : query.isError ? (
        <p className="text-sm text-red-600">
          {getErrorMessage(query.error, '读取编译产物失败')}
        </p>
      ) : (
        <Scroll
          className="rounded border border-neutral-200 bg-neutral-950 dark:border-neutral-800"
          orientation="both"
          viewportClassName="max-h-[70vh]"
        >
          <pre className="p-4 font-mono text-xs leading-5 text-neutral-100">
            {query.data || '暂无编译产物'}
          </pre>
        </Scroll>
      )}
    </Modal>
  )
}

function FunctionLogsDrawer(props: {
  onClose: () => void
  open: boolean
  snippet: SnippetModel | null
}) {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!props.open) {
      setPage(1)
      setStatusFilter('all')
      setExpandedId(null)
    }
  }, [props.open])

  useEffect(() => {
    setPage(1)
    setExpandedId(null)
  }, [statusFilter])

  const logsQuery = useQuery({
    enabled: props.open && Boolean(props.snippet?.id),
    queryFn: () =>
      getInvocationLogs(String(props.snippet?.id), {
        page,
        size: logPageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    queryKey: ['serverless', 'logs', props.snippet?.id, page, statusFilter],
  })
  const logs = logsQuery.data?.data ?? []
  const pagination = logsQuery.data?.pagination

  return (
    <SidePanel
      onClose={props.onClose}
      open={props.open}
      title={`函数调用日志${props.snippet?.name ? `：${props.snippet.name}` : ''}`}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="grid grid-cols-3 gap-1 rounded bg-neutral-100 p-1 dark:bg-neutral-900">
          {[
            { label: '全部', value: 'all' },
            { label: '成功', value: 'success' },
            { label: '错误', value: 'error' },
          ].map((item) => (
            <button
              className={cn(
                'rounded px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === item.value
                  ? 'shadow-xs bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
              )}
              key={item.value}
              onClick={() => setStatusFilter(item.value as StatusFilter)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <Scroll className="flex-1">
          {logsQuery.isLoading ? (
            <div className="flex justify-center py-20">
              <InlineLoading label="正在读取调用日志" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex min-h-60 items-center justify-center text-sm text-neutral-500">
              暂无调用记录
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <LogItem
                  expanded={expandedId === log.id}
                  key={log.id}
                  log={log}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === log.id ? null : log.id,
                    )
                  }
                />
              ))}
            </div>
          )}
        </Scroll>

        {pagination && pagination.totalPage > 1 ? (
          <div className="flex shrink-0 justify-center border-t border-neutral-200 pt-3 dark:border-neutral-800">
            <CompactPagination
              onPageChange={setPage}
              onPageSizeChange={() => undefined}
              page={page}
              pageCount={pagination.totalPage}
              pageSize={logPageSize}
              pageSizes={[logPageSize]}
            />
          </div>
        ) : null}
      </div>
    </SidePanel>
  )
}

function LogItem(props: {
  expanded: boolean
  log: ServerlessLogEntry
  onToggle: () => void
}) {
  return (
    <div className="overflow-hidden rounded border border-neutral-200 dark:border-neutral-800">
      <button
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
        onClick={props.onToggle}
        type="button"
      >
        {props.expanded ? (
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 shrink-0 text-neutral-400"
          />
        ) : (
          <ChevronRight
            aria-hidden="true"
            className="size-3.5 shrink-0 text-neutral-400"
          />
        )}
        <span
          className={cn(
            'inline-block size-2 shrink-0 rounded-full',
            props.log.status === 'success' ? 'bg-green-500' : 'bg-red-500',
          )}
        />
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
            props.log.status === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
          )}
        >
          {props.log.method}
        </span>
        <span className="shrink-0 text-xs text-neutral-500">
          {props.log.executionTime}ms
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">
          {props.log.ip}
        </span>
        <span className="shrink-0 text-xs text-neutral-400">
          {relativeTimeFromNow(props.log.createdAt)}
        </span>
      </button>
      {props.expanded ? <LogDetail id={props.log.id} /> : null}
    </div>
  )
}

function LogDetail(props: { id: string }) {
  const query = useQuery({
    queryFn: () => getInvocationLogDetail(props.id),
    queryKey: ['serverless', 'log-detail', props.id],
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="border-t border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
      {query.isLoading ? (
        <InlineLoading label="正在读取详情" />
      ) : query.isError ? (
        <p className="text-xs text-red-600">
          {getErrorMessage(query.error, '无法加载详情')}
        </p>
      ) : query.data ? (
        <div className="space-y-3">
          {query.data.logs && query.data.logs.length > 0 ? (
            <div>
              <h4 className="mb-1.5 text-xs font-medium text-neutral-500">
                Console
              </h4>
              <div className="rounded bg-neutral-100 p-3 font-mono text-xs text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                {query.data.logs.map((entry, index) => (
                  <div
                    className={cn(
                      'whitespace-pre-wrap break-all',
                      logLevelColor(entry.level),
                    )}
                    key={index}
                  >
                    <span className="mr-2 select-none text-neutral-500">
                      [{entry.level}]
                    </span>
                    {formatLogArgs(entry.args)}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {query.data.error ? (
            <div>
              <h4 className="mb-1.5 text-xs font-medium text-red-600">Error</h4>
              <div className="rounded bg-red-100 p-3 font-mono text-xs text-red-900 dark:bg-red-950/90 dark:text-red-100">
                <div className="font-semibold">
                  {query.data.error.name}: {query.data.error.message}
                </div>
                {query.data.error.stack ? (
                  <pre className="mt-2 whitespace-pre-wrap break-all dark:text-red-200">
                    {query.data.error.stack}
                  </pre>
                ) : null}
              </div>
            </div>
          ) : null}
          {(!query.data.logs || query.data.logs.length === 0) &&
          !query.data.error ? (
            <p className="text-xs text-neutral-400">无输出</p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-neutral-400">无法加载详情</p>
      )}
    </div>
  )
}

function Field(props: { children: ReactNode; label: string }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="block text-xs text-neutral-500 dark:text-neutral-400">
        {props.label}
      </span>
      {props.children}
    </label>
  )
}

function Modal(props: {
  children: ReactNode
  onClose: () => void
  open: boolean
  title: string
}) {
  if (!props.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="text-lg font-semibold">{props.title}</h2>
          <button
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
            onClick={props.onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <Scroll className="flex-1" innerClassName="p-5">
          {props.children}
        </Scroll>
      </div>
    </div>
  )
}

function SidePanel(props: {
  children: ReactNode
  onClose: () => void
  open: boolean
  title: string
}) {
  if (!props.open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={props.onClose}
        type="button"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <h2 className="text-lg font-semibold">{props.title}</h2>
          <button
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
            onClick={props.onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 p-5">{props.children}</div>
      </aside>
    </div>
  )
}

function InlineLoading(props: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-neutral-500">
      <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      {props.label}
    </span>
  )
}

function SnippetSkeleton() {
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

function SnippetEmpty() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <Code2 aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        暂无片段
      </p>
    </div>
  )
}

function SnippetDetailLoading() {
  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <Loader2
        aria-hidden="true"
        className="size-8 animate-spin text-neutral-300"
      />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        正在读取片段详情。
      </p>
    </div>
  )
}

function SnippetDetailEmpty() {
  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center px-4 text-center">
      <Code2 aria-hidden="true" className="size-8 text-neutral-300" />
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
        选择一个片段查看详情。
      </p>
    </div>
  )
}

function normalizeSnippet(snippet: CreateSnippetData | SnippetModel) {
  return {
    comment: snippet.comment ?? '',
    customPath: snippet.customPath ?? '',
    enable: Boolean(snippet.enable),
    metatype: snippet.metatype ?? '',
    method: snippet.method ?? '',
    name: snippet.name ?? '',
    private: Boolean(snippet.private),
    raw: snippet.raw ?? '',
    reference: snippet.reference ?? 'root',
    schema: snippet.schema ?? '',
    secret: serializeSnippetSecret(snippet.secret),
    type: snippet.type ?? SnippetType.JSON,
  } satisfies CreateSnippetData
}

function prepareSnippetPayload(form: CreateSnippetData): CreateSnippetData {
  const payload: CreateSnippetData = {
    ...form,
    raw: normalizeSnippetRawForSave(form.type, form.raw),
  }

  if (!payload.metatype) delete payload.metatype
  if (!payload.schema) delete payload.schema
  if (!payload.customPath) delete payload.customPath
  if (!payload.method) delete payload.method
  if (payload.secret) payload.secret = parseSnippetSecret(payload.secret)
  else delete payload.secret

  return payload
}

function normalizeSnippetRawForSave(type: SnippetType, raw: string) {
  switch (type) {
    case SnippetType.JSON:
      try {
        return JSON.stringify(JSON.parse(raw))
      } catch {
        throw new Error('JSON 格式错误')
      }
    case SnippetType.YAML:
      try {
        load(raw)
        return raw
      } catch {
        throw new Error('YAML 格式错误')
      }
    case SnippetType.JSON5:
      try {
        JSON5.parse(raw)
        return raw
      } catch {
        throw new Error('JSON5 格式错误')
      }
    case SnippetType.Function:
    case SnippetType.Text:
      return raw
  }
}

function getSnippetDefaultsForType(
  type: SnippetType,
  previousType: SnippetType,
  previousRaw: string,
): Partial<CreateSnippetData> {
  if (type === previousType) return {}

  if (type === SnippetType.Function) {
    return {
      enable: true,
      method: 'GET',
      raw: defaultServerlessFunction,
    }
  }

  if (type === SnippetType.Text) {
    return {
      enable: undefined,
      method: undefined,
      raw: '',
    }
  }

  const value =
    previousType === SnippetType.JSON ||
    previousType === SnippetType.JSON5 ||
    previousType === SnippetType.YAML
      ? readStructuredSnippetRaw(previousType, previousRaw)
      : { name: 'hello world' }

  return {
    enable: undefined,
    method: undefined,
    raw: writeStructuredSnippetRaw(type, value),
  }
}

function readStructuredSnippetRaw(type: SnippetType, raw: string) {
  try {
    switch (type) {
      case SnippetType.JSON:
        return JSON.parse(raw)
      case SnippetType.JSON5:
        return JSON5.parse(raw)
      case SnippetType.YAML:
        return load(raw)
      case SnippetType.Function:
      case SnippetType.Text:
        return raw
    }
  } catch {
    toast.warning('当前内容无法转换，已使用默认内容')
    return { name: 'hello world' }
  }
}

function writeStructuredSnippetRaw(type: SnippetType, value: unknown) {
  switch (type) {
    case SnippetType.JSON:
      return JSON.stringify(value ?? {}, null, 2)
    case SnippetType.JSON5:
      return JSON5.stringify(value ?? {}, null, 2)
    case SnippetType.YAML:
      return dump(value)
    case SnippetType.Function:
    case SnippetType.Text:
      return String(value ?? '')
  }
}

function serializeSnippetSecret(secret: CreateSnippetData['secret']) {
  if (!secret) return ''
  if (typeof secret === 'string') return secret

  return JSON.stringify(secret, null, 2)
}

function parseSnippetSecret(secret: CreateSnippetData['secret']) {
  if (!secret || typeof secret !== 'string') return secret
  const text = secret.trim()
  if (!text) return undefined
  try {
    return JSON5.parse(text) as Record<string, unknown>
  } catch {
    return text
  }
}

function groupSnippetList(snippets: SnippetModel[]) {
  const groups = new Map<string, SnippetModel[]>()

  for (const snippet of snippets) {
    const reference = snippet.reference || 'root'
    groups.set(reference, [...(groups.get(reference) ?? []), snippet])
  }

  return [...groups.entries()]
    .map(([reference, groupSnippets]) => ({
      reference,
      snippets: groupSnippets,
    }))
    .sort((left, right) => left.reference.localeCompare(right.reference))
}

async function fetchAvailableSnippetPackages() {
  const data = await fetchGitHubSnippetTree()

  if (!Array.isArray(data)) return []

  return data
    .filter(
      (item) =>
        item.type === 'dir' &&
        (import.meta.env.DEV ? true : !item.name.startsWith('test:')),
    )
    .map((item) => ({
      name: item.name,
      url: item.html_url || '',
    }))
}

async function loadSnippetPackage(name: string): Promise<ImportPackagePreview> {
  const tree = await fetchGitHubSnippetTree(name)

  if (!Array.isArray(tree)) {
    throw new Error('扩展包结构无效')
  }

  const functions: ImportFunctionPreview[] = []
  const dependencies: string[] = []

  await Promise.all(
    tree.map(async (item) => {
      if (item.type === 'dir' && item.name === 'functions') {
        const files = await fetchGitHubSnippetTree(`${name}/functions`)
        if (!Array.isArray(files)) return

        await Promise.all(
          files.map(async (file) => {
            if (
              file.type !== 'file' ||
              !/\.(js|ts)$/.test(file.name) ||
              !file.download_url
            ) {
              return
            }

            const raw = await fetchGitHubText(file.download_url)
            functions.push({
              htmlUrl: file.html_url,
              name: file.name,
              raw,
              reference: name,
            })
          }),
        )
      }

      if (item.type === 'file' && item.name === 'package.json') {
        if (!item.download_url) throw new Error('无法获取 package.json')
        const packageJson = JSON.parse(await fetchGitHubText(item.download_url))
        dependencies.push(
          ...Object.entries(
            (packageJson.dependencies ?? {}) as Record<string, string>,
          ).map(([packageName, version]) => `${packageName}@${version}`),
        )
      }
    }),
  )

  return { dependencies, functions }
}

function basenameWithoutExt(name: string) {
  return name.replace(/\.[^.]+$/, '')
}

function parsePackageInput(input: string) {
  return input
    .split(/[\s,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function logLevelColor(level: string) {
  switch (level) {
    case 'warn':
      return 'text-amber-700 dark:text-amber-400'
    case 'error':
      return 'text-red-700 dark:text-red-400'
    case 'info':
      return 'text-blue-700 dark:text-blue-400'
    case 'debug':
      return 'text-neutral-600 dark:text-neutral-400'
    default:
      return 'text-neutral-700 dark:text-neutral-300'
  }
}

function formatLogArgs(args: unknown[]) {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg
      try {
        return JSON.stringify(arg, null, 2)
      } catch {
        return String(arg)
      }
    })
    .join(' ')
}

function readSnippetTypeFilter(value: string | null): SnippetType | '' {
  return snippetTypes.includes(value as SnippetType)
    ? (value as SnippetType)
    : ''
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
