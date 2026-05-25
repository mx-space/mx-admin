import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Braces,
  Eye,
  FileCode2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import ejs from 'ejs'
import { toast } from 'sonner'

import {
  deleteEmailTemplate,
  getEmailTemplate,
  updateEmailTemplate,
} from '../api/options'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { CodeEditor } from '../ui/code-editor'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '../ui/layout'
import { Scroll } from '../ui/scroll'
import { SelectField } from '../ui/select'

type TemplateType = 'guest' | 'newsletter' | 'owner'

const templateTypes: Array<{ label: string; value: TemplateType }> = [
  { label: '回复邮件（访客）', value: 'guest' },
  { label: '回复邮件（博主）', value: 'owner' },
  { label: '订阅邮件', value: 'newsletter' },
]

const templateQueryKey = ['templates', 'email']
type TemplateTab = 'email' | 'markdown'

export function TemplatePage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TemplateTab>('email')
  const [templateType, setTemplateType] = useState<TemplateType>('guest')
  const [source, setSource] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewError, setPreviewError] = useState('')

  const templateQuery = useQuery({
    queryFn: () => getEmailTemplate(templateType),
    queryKey: [...templateQueryKey, templateType],
  })
  const savedSource = templateQuery.data?.template ?? ''
  const isDirty = source !== savedSource

  useEffect(() => {
    if (templateQuery.data?.template !== undefined) {
      setSource(templateQuery.data.template)
    }
  }, [templateQuery.data?.template])

  useEffect(() => {
    let cancelled = false
    setPreviewError('')

    if (!source) {
      setPreviewHtml('')
      return
    }

    Promise.resolve(
      ejs.render(source, templateQuery.data?.props ?? {}, { async: true }),
    )
      .then((html) => {
        if (cancelled) return
        setPreviewHtml(html)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setPreviewError(getErrorMessage(error, '模板渲染失败'))
      })

    return () => {
      cancelled = true
    }
  }, [source, templateQuery.data?.props])

  const invalidateTemplates = async () => {
    await queryClient.invalidateQueries({ queryKey: templateQueryKey })
  }

  const saveMutation = useMutation({
    mutationFn: () => updateEmailTemplate(templateType, source),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '保存失败')),
    onSuccess: async () => {
      toast.success('模板已保存')
      await invalidateTemplates()
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => deleteEmailTemplate(templateType),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '重置失败')),
    onSuccess: async () => {
      toast.success('模板已重置')
      await invalidateTemplates()
    },
  })

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-950">
      <header
        className={cn(
          'flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800',
          APP_SHELL_HEADER_HEIGHT_CLASS,
        )}
      >
        <h2 className="inline-flex items-center gap-2 text-sm font-medium">
          <FileCode2 aria-hidden="true" className="size-4" />
          模板
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={templateQuery.isFetching}
            onClick={() => void templateQuery.refetch()}
            type="button"
            variant="subtle"
          >
            <RefreshCw
              aria-hidden="true"
              className={cn(
                'size-4',
                templateQuery.isFetching && 'animate-spin',
              )}
            />
            刷新
          </Button>
          <Button
            disabled={resetMutation.isPending}
            onClick={() => {
              if (window.confirm('确认恢复默认模板？')) {
                resetMutation.mutate()
              }
            }}
            type="button"
            variant="subtle"
          >
            {resetMutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <RotateCcw aria-hidden="true" className="size-4" />
            )}
            重置
          </Button>
          <Button
            disabled={
              saveMutation.isPending || templateQuery.isLoading || !isDirty
            }
            onClick={() => saveMutation.mutate()}
            type="button"
          >
            {saveMutation.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            {isDirty ? '保存' : '已保存'}
          </Button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 pt-3 dark:border-neutral-800">
        <div className="flex gap-1">
          {[
            { icon: FileCode2, label: '邮件模板', value: 'email' },
            { icon: Braces, label: '预览 Markdown 模板', value: 'markdown' },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                className={cn(
                  'inline-flex items-center gap-2 rounded-t px-3 py-2 text-sm font-medium transition-colors',
                  activeTab === tab.value
                    ? 'bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:hover:bg-neutral-900/70 dark:hover:text-neutral-100',
                )}
                key={tab.value}
                onClick={() => setActiveTab(tab.value as TemplateTab)}
                type="button"
              >
                <Icon aria-hidden="true" className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
        {activeTab === 'email' ? (
          <SelectField
            aria-label="模板类型"
            className="mb-3 w-48"
            onValueChange={setTemplateType}
            options={templateTypes}
            value={templateType}
          />
        ) : null}
      </div>

      {activeTab === 'markdown' ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-sm text-neutral-500 dark:text-neutral-400">
          即将推出
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_24rem]">
          <div
            className={cn(
              'min-h-0 border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800',
              previewError && 'outline outline-2 outline-red-300',
            )}
          >
            {templateQuery.isLoading ? (
              <TemplateSkeleton />
            ) : (
              <TemplateCodeEditor
                dirty={isDirty}
                onChange={setSource}
                onSave={() => {
                  if (isDirty && !saveMutation.isPending) {
                    saveMutation.mutate()
                  }
                }}
                saving={saveMutation.isPending}
                value={source}
              />
            )}
          </div>
          <section className="min-h-0 border-b border-neutral-200 bg-neutral-50 lg:border-b-0 lg:border-r dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex h-10 items-center justify-between border-b border-neutral-200 px-3 dark:border-neutral-800">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase text-neutral-500">
                <Eye aria-hidden="true" className="size-4" />
                EJS Preview
              </span>
              {previewError ? (
                <span className="inline-flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle aria-hidden="true" className="size-3.5" />
                  渲染失败
                </span>
              ) : null}
            </div>
            {previewError ? (
              <div className="p-4">
                <pre className="whitespace-pre-wrap rounded border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800 dark:border-red-950 dark:bg-red-950/30 dark:text-red-200">
                  {previewError}
                </pre>
              </div>
            ) : (
              <iframe
                className="h-full min-h-0 w-full bg-white"
                sandbox=""
                srcDoc={previewHtml}
                title="EJS template preview"
              />
            )}
          </section>
          <aside className="min-h-0 p-4">
            <h3 className="mb-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
              示例 Props
            </h3>
            <Scroll
              className="rounded border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
              orientation="both"
              viewportClassName="max-h-full"
            >
              <pre className="p-3 text-xs leading-5 text-neutral-800 dark:text-neutral-200">
                {JSON.stringify(templateQuery.data?.props ?? {}, null, 2)}
              </pre>
            </Scroll>
          </aside>
        </div>
      )}
    </div>
  )
}

function TemplateSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900"
          key={index}
        />
      ))}
    </div>
  )
}

function TemplateCodeEditor(props: {
  dirty: boolean
  onChange: (value: string) => void
  onSave: () => void
  saving: boolean
  value: string
}) {
  return (
    <CodeEditor
      dirty={props.dirty}
      language="html"
      onChange={props.onChange}
      onSave={props.onSave}
      saving={props.saving}
      title="html / ejs"
      value={props.value}
    />
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
