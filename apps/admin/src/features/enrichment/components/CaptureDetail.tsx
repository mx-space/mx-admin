import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Camera, ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type {
  EnrichmentCaptureJoinedRow,
  EnrichmentCaptureQuota,
} from '~/models/enrichment'

import { deleteEnrichmentCapture, recaptureEnrichment } from '~/api/enrichment'
import { Button } from '~/ui/button'
import { cn } from '~/ui/cn'
import { APP_SHELL_HEADER_HEIGHT_CLASS } from '~/ui/layout'
import { Scroll } from '~/ui/scroll'
import { relativeTimeFromNow } from '~/utils/time'

import {
  formatBytes,
  getErrorMessage,
  getRecaptureDisabledReason,
} from '../utils/enrichment'
import { Code, DetailBlock, Field } from './EnrichmentPrimitives'

export function CaptureDetail(props: {
  invalidateAll: () => Promise<void>
  onDeleted: (id: string) => void
  onBack: () => void
  quota: EnrichmentCaptureQuota | null
  row: EnrichmentCaptureJoinedRow
}) {
  const recaptureDisabledReason = getRecaptureDisabledReason(props.quota)
  const recaptureMutation = useMutation({
    mutationFn: () => recaptureEnrichment(props.row.enrichmentId),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '重抓失败')),
    onSuccess: async () => {
      toast.success('已重新抓取')
      await props.invalidateAll()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteEnrichmentCapture(props.row.enrichmentId),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, '删除失败')),
    onSuccess: async () => {
      toast.success('截图已删除')
      props.onDeleted(props.row.enrichmentId)
      await props.invalidateAll()
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
        <div className="flex min-w-0 items-center gap-2">
          <button
            className="inline-flex size-8 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 lg:hidden dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-50"
            onClick={props.onBack}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
              {props.row.title || props.row.url}
            </h2>
            <p className="mt-1 truncate text-sm text-neutral-500 dark:text-neutral-400">
              {props.row.provider} · {props.quota?.fetchMode ?? 'capture'}
            </p>
          </div>
        </div>
        <a
          className="inline-flex size-9 items-center justify-center rounded border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          href={props.row.url}
          rel="noreferrer"
          target="_blank"
          title="打开原始链接"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      </div>
      <Scroll className="flex-1" innerClassName="px-5 py-4">
        <div
          className="overflow-hidden rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
          style={
            props.row.palette?.dominant
              ? { backgroundColor: props.row.palette.dominant }
              : undefined
          }
        >
          <a
            className="block"
            href={props.row.publicUrl}
            rel="noreferrer"
            target="_blank"
          >
            <img
              alt={props.row.title || props.row.url}
              className="max-h-[32rem] w-full object-contain"
              src={props.row.publicUrl}
            />
          </a>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Field label="Provider">{props.row.provider}</Field>
          <Field label="External ID">
            <Code>{props.row.externalId}</Code>
          </Field>
          <Field label="尺寸">
            {props.row.width} x {props.row.height}
          </Field>
          <Field label="体积">{formatBytes(props.row.bytes)}</Field>
          <Field label="创建时间">
            {relativeTimeFromNow(props.row.createdAt)}
          </Field>
          <Field label="最近访问">
            {relativeTimeFromNow(props.row.lastAccessedAt)}
          </Field>
          <Field label="Object Key">
            <Code>{props.row.objectKey}</Code>
          </Field>
          <Field label="Enrichment ID">
            <Code>{props.row.enrichmentId}</Code>
          </Field>
        </div>
        {props.row.palette?.swatches?.length ? (
          <DetailBlock title="调色板">
            <div className="flex items-center gap-1.5">
              {props.row.palette.swatches.slice(0, 5).map((color) => (
                <span
                  className="block size-7 rounded border border-neutral-200 dark:border-neutral-800"
                  key={color}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </DetailBlock>
        ) : null}
      </Scroll>
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <Button
          disabled={recaptureMutation.isPending || !!recaptureDisabledReason}
          onClick={() => recaptureMutation.mutate()}
          title={recaptureDisabledReason ?? '重新截图'}
          type="button"
          variant="subtle"
        >
          {recaptureMutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Camera aria-hidden="true" className="size-4" />
          )}
          重新截图
        </Button>
        <Button
          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (window.confirm('确认删除此截图？')) deleteMutation.mutate()
          }}
          type="button"
          variant="subtle"
        >
          {deleteMutation.isPending ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Trash2 aria-hidden="true" className="size-4" />
          )}
          删除
        </Button>
      </div>
    </div>
  )
}
