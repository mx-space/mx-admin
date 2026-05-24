import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Code2, Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { SnippetModel } from '~/app/models/snippet'
import type { CreateSnippetData } from '../api/snippets'

import { SnippetType } from '~/app/models/snippet'
import { relativeTimeFromNow } from '~/app/utils/time'

import {
  createSnippet,
  deleteSnippet,
  getSnippets,
  resetFunctionSnippet,
  updateSnippet,
} from '../api/snippets'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { cn } from '../ui/cn'
import { SelectField } from '../ui/select'
import { TextArea, TextInput } from '../ui/text-field'

const snippetsQueryKey = ['snippets']

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

export function SnippetsPage() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null)
  const [typeFilter, setTypeFilter] = useState<SnippetType | ''>('')

  const snippetsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      getSnippets({
        page: 1,
        size: 100,
        type: typeFilter || undefined,
      }),
    queryKey: [...snippetsQueryKey, 'list', typeFilter],
  })

  const snippets = snippetsQuery.data?.data ?? []
  const selectedSnippet = useMemo(
    () => snippets.find((snippet) => snippet.id === selectedId) ?? null,
    [selectedId, snippets],
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

  return (
    <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 overflow-hidden rounded border border-neutral-200 bg-white lg:grid-cols-[minmax(320px,0.36fr)_1fr] dark:border-neutral-800 dark:bg-neutral-950">
      <section className="flex min-h-0 flex-col border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div>
            <h2 className="text-sm font-medium">配置与云函数</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              共 {snippetsQuery.data?.pagination.total ?? 0} 个片段
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSelectedId('new')}
              type="button"
              variant="subtle"
            >
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

        <div className="border-b border-neutral-200 p-3 dark:border-neutral-800">
          <SelectField
            aria-label="片段类型筛选"
            onValueChange={setTypeFilter}
            options={[
              { label: '全部类型', value: '' },
              ...snippetTypes.map((type) => ({ label: type, value: type })),
            ]}
            value={typeFilter}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {snippetsQuery.isLoading && snippets.length === 0 ? (
            <SnippetSkeleton />
          ) : snippets.length === 0 ? (
            <SnippetEmpty />
          ) : (
            snippets.map((snippet) => (
              <SnippetRow
                key={snippet.id}
                onSelect={() => setSelectedId(snippet.id)}
                selected={selectedId === snippet.id}
                snippet={snippet}
              />
            ))
          )}
        </div>
      </section>

      <section className="min-h-0">
        {selectedId === 'new' ? (
          <SnippetEditor
            initialValue={emptySnippet}
            mode="create"
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
            onDelete={(snippet) => {
              if (window.confirm(`确认删除「${snippet.name}」？`)) {
                deleteMutation.mutate(snippet.id)
              }
            }}
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
        ) : (
          <SnippetDetailEmpty />
        )}
      </section>
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
  onDelete?: (snippet: SnippetModel) => void
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
        ? createSnippet(form)
        : updateSnippet((props.initialValue as SnippetModel).id, form),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存失败')),
    onSuccess: (snippet) => {
      toast.success('片段已保存')
      props.onSaved(snippet)
    },
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim()) {
      toast.error('请填写片段名称')
      return
    }
    mutation.mutate()
  }

  const editSnippet =
    props.mode === 'edit' ? (props.initialValue as SnippetModel) : null

  return (
    <form className="flex h-full min-h-0 flex-col" onSubmit={onSubmit}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
            {props.mode === 'create' ? '新建片段' : form.name || '未命名片段'}
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {form.type} · {form.reference || 'root'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editSnippet?.builtIn && props.onReset ? (
            <Button
              disabled={props.resetting}
              onClick={() => props.onReset?.(editSnippet)}
              type="button"
              variant="subtle"
            >
              {props.resetting ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              重置
            </Button>
          ) : null}
          {editSnippet && props.onDelete ? (
            <Button
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
              disabled={props.deleting}
              onClick={() => props.onDelete?.(editSnippet)}
              type="button"
              variant="subtle"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              删除
            </Button>
          ) : null}
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            保存
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="space-y-3 border-b border-neutral-200 p-4 lg:border-b-0 lg:border-r dark:border-neutral-800">
          <Field label="名称">
            <TextInput
              onChange={(name) => setForm((current) => ({ ...current, name }))}
              value={form.name}
            />
          </Field>
          <Field label="类型">
            <SelectField
              onValueChange={(type) =>
                setForm((current) => ({
                  ...current,
                  type,
                }))
              }
              options={snippetTypes.map((type) => ({
                label: type,
                value: type,
              }))}
              value={form.type}
            />
          </Field>
          <Field label="分组">
            <TextInput
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
          <Checkbox
            checked={Boolean(form.private)}
            label="私有"
            onCheckedChange={(checked) =>
              setForm((current) => ({
                ...current,
                private: checked,
              }))
            }
          />
          {form.type === SnippetType.Function ? (
            <>
              <Checkbox
                checked={Boolean(form.enable)}
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
            </>
          ) : null}
        </div>

        <TextArea
          controlClassName="min-h-[32rem] resize-none rounded-none border-0 bg-transparent p-4 font-mono text-xs leading-5 focus:border-transparent focus:ring-0 dark:border-0 dark:bg-transparent"
          onChange={(raw) => setForm((current) => ({ ...current, raw }))}
          spellCheck={false}
          value={form.raw}
        />
      </div>
    </form>
  )
}

function Field(props: { children: React.ReactNode; label: string }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="block text-xs text-neutral-500 dark:text-neutral-400">
        {props.label}
      </span>
      {props.children}
    </label>
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
    method: snippet.method ?? '',
    name: snippet.name ?? '',
    private: Boolean(snippet.private),
    raw: snippet.raw ?? '',
    reference: snippet.reference ?? 'root',
    type: snippet.type ?? SnippetType.JSON,
  } satisfies CreateSnippetData
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
