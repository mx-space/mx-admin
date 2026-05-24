import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileCode2, Loader2, RefreshCw, RotateCcw, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  deleteEmailTemplate,
  getEmailTemplate,
  updateEmailTemplate,
} from '../api/options'
import { Button } from '../ui/button'
import { cn } from '../ui/cn'
import { Panel } from '../ui/panel'
import { SelectField } from '../ui/select'
import { TextArea } from '../ui/text-field'

type TemplateType = 'guest' | 'newsletter' | 'owner'

const templateTypes: Array<{ label: string; value: TemplateType }> = [
  { label: '回复邮件（访客）', value: 'guest' },
  { label: '回复邮件（博主）', value: 'owner' },
  { label: '订阅邮件', value: 'newsletter' },
]

const templateQueryKey = ['templates', 'email']

export function TemplatePage() {
  const queryClient = useQueryClient()
  const [templateType, setTemplateType] = useState<TemplateType>('guest')
  const [source, setSource] = useState('')

  const templateQuery = useQuery({
    queryFn: () => getEmailTemplate(templateType),
    queryKey: [...templateQueryKey, templateType],
  })

  useEffect(() => {
    if (templateQuery.data?.template !== undefined) {
      setSource(templateQuery.data.template)
    }
  }, [templateQuery.data?.template])

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
    <div className="space-y-4">
      <Panel
        description="邮件模板源码编辑和示例 props 审计。"
        title={
          <span className="inline-flex items-center gap-2">
            <FileCode2 aria-hidden="true" className="size-4" />
            模板编辑
          </span>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
          <SelectField
            aria-label="模板类型"
            className="w-48"
            onValueChange={setTemplateType}
            options={templateTypes}
            value={templateType}
          />
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
              disabled={saveMutation.isPending || templateQuery.isLoading}
              onClick={() => saveMutation.mutate()}
              type="button"
            >
              {saveMutation.isPending ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="size-4" />
              )}
              保存
            </Button>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-16rem)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-h-0 border-b border-neutral-200 lg:border-b-0 lg:border-r dark:border-neutral-800">
            {templateQuery.isLoading ? (
              <TemplateSkeleton />
            ) : (
              <TextArea
                controlClassName="h-full min-h-[32rem] resize-none border-0 bg-transparent p-4 font-mono text-xs leading-5 focus:border-transparent focus:ring-0 dark:border-0 dark:bg-transparent"
                onChange={setSource}
                spellCheck={false}
                value={source}
              />
            )}
          </div>
          <aside className="min-h-0 p-4">
            <h3 className="mb-2 text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
              示例 Props
            </h3>
            <pre className="max-h-[34rem] overflow-auto rounded border border-neutral-200 bg-neutral-50 p-3 text-xs leading-5 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
              {JSON.stringify(templateQuery.data?.props ?? {}, null, 2)}
            </pre>
          </aside>
        </div>
      </Panel>
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
