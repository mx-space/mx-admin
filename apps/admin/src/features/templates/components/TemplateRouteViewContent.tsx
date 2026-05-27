import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Eye,
  FileCode2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ejs from 'ejs'
import { toast } from 'sonner'
import type { TemplateTab, TemplateType } from '../types/templates'

import {
  deleteEmailTemplate,
  getEmailTemplate,
  updateEmailTemplate,
} from '~/api/options'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/constants/layout'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'
import { SelectField } from '~/ui/primitives/select'
import { cn } from '~/utils/cn'

import {
  templateQueryKey,
  templateTabs,
  templateTypeOptions,
} from '../constants'
import { getErrorMessage } from '../utils/errors'
import { TemplateCodeEditor } from './TemplateCodeEditor'
import { TemplateSkeleton } from './TemplateSkeleton'

export function TemplateRouteViewContent() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TemplateTab>('email')
  const [templateType, setTemplateType] = useState<TemplateType>('guest')
  const [source, setSource] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewError, setPreviewError] = useState('')

  const templateTypes = useMemo(
    () =>
      templateTypeOptions.map((option) => ({
        label: t(option.labelKey),
        value: option.value,
      })),
    [t],
  )

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
        setPreviewError(getErrorMessage(error, t('templates.renderError')))
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
      toast.error(getErrorMessage(error, t('templates.saveFailed'))),
    onSuccess: async () => {
      toast.success(t('templates.saveSuccess'))
      await invalidateTemplates()
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => deleteEmailTemplate(templateType),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('templates.resetFailed'))),
    onSuccess: async () => {
      toast.success(t('templates.resetSuccess'))
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
          {t('templates.title')}
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
            {t('common.refresh')}
          </Button>
          <Button
            disabled={resetMutation.isPending}
            onClick={() => {
              if (window.confirm(t('templates.resetConfirm'))) {
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
            {t('templates.reset')}
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
            {isDirty ? t('common.save') : t('templates.saved')}
          </Button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 pt-3 dark:border-neutral-800">
        <div className="flex gap-1">
          {templateTabs.map((tab) => {
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
                onClick={() => setActiveTab(tab.value)}
                type="button"
              >
                <Icon aria-hidden="true" className="size-4" />
                {t(tab.labelKey)}
              </button>
            )
          })}
        </div>
        {activeTab === 'email' ? (
          <SelectField
            aria-label={t('templates.selectAria')}
            className="mb-3 w-48"
            onValueChange={setTemplateType}
            options={templateTypes}
            value={templateType}
          />
        ) : null}
      </div>

      {activeTab === 'markdown' ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-sm text-neutral-500 dark:text-neutral-400">
          {t('templates.markdownComing')}
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
                  {t('templates.previewFailed')}
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
              {t('templates.sampleProps')}
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
