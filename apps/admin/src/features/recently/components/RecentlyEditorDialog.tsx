import { Dialog } from '@base-ui/react/dialog'
import { useMutation } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { RecentlyModel } from '~/models/recently'
import type { UrlPreviewState } from '../types/recently'

import { resolveEnrichment } from '~/api/enrichment'
import { createRecently, updateRecently } from '~/api/recently'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/primitives/button'
import { TextArea } from '~/ui/primitives/text-field'

import { cleanErrorMessage, extractUrls } from '../utils/recently'
import { EnrichmentInlineCard } from './RecentlyPrimitives'

export function RecentlyEditorDialog(props: {
  item: RecentlyModel | null
  onClose: () => void
  onSuccess: () => Promise<void>
  open: boolean
}) {
  const { t } = useI18n()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewGenerationRef = useRef(0)
  const [content, setContent] = useState('')
  const [detectedUrls, setDetectedUrls] = useState<string[]>([])
  const [error, setError] = useState('')
  const [previewStates, setPreviewStates] = useState<
    Record<string, UrlPreviewState>
  >({})
  const isEdit = Boolean(props.item?.id)

  useEffect(() => {
    if (!props.open) return

    setContent(props.item?.content ?? '')
    setError('')
  }, [props.item, props.open])

  useEffect(() => {
    const urls = extractUrls(content)
    setDetectedUrls(urls)
    setPreviewStates({})

    if (!props.open || urls.length === 0) return

    const generation = ++previewGenerationRef.current
    const timer = window.setTimeout(() => {
      urls.forEach((url) => {
        setPreviewStates((current) => ({
          ...current,
          [url]: { error: null, loading: true, result: null },
        }))

        resolveEnrichment(url)
          .then((result) => {
            if (previewGenerationRef.current !== generation) return
            setPreviewStates((current) => ({
              ...current,
              [url]: { error: null, loading: false, result },
            }))
          })
          .catch((previewError: unknown) => {
            if (previewGenerationRef.current !== generation) return
            setPreviewStates((current) => ({
              ...current,
              [url]: {
                error:
                  previewError instanceof Error
                    ? previewError.message
                    : t('recently.error.parseFailed'),
                loading: false,
                result: null,
              },
            }))
          })
      })
    }, 500)

    return () => {
      window.clearTimeout(timer)
      previewGenerationRef.current += 1
    }
  }, [content, props.open])

  const mutation = useMutation({
    mutationFn: async () => {
      const data = { content: content.trim() }
      if (props.item?.id) return updateRecently(props.item.id, data)
      return createRecently(data)
    },
    onSuccess: async () => {
      toast.success(t('recently.editor.saveSuccess'))
      await props.onSuccess()
    },
  })

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()

    if (!content.trim()) {
      setError(t('recently.editor.contentRequired'))
      return
    }

    setError('')
    mutation.mutate()
  }

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      open={props.open}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" />
        <Dialog.Popup
          className="outline-hidden fixed left-1/2 top-1/2 z-50 w-[min(92vw,38rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
          initialFocus={textareaRef}
        >
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <Dialog.Title className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {isEdit
                  ? t('recently.editor.editTitle')
                  : t('recently.editor.createTitle')}
              </Dialog.Title>
              <Dialog.Close
                aria-label={t('common.close')}
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </div>

            <div className="px-5 py-4">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {t('recently.editor.contentLabel')}{' '}
                  <span className="text-red-500">*</span>
                </span>
                <TextArea
                  controlClassName="min-h-36"
                  onChange={setContent}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      (event.metaKey || event.ctrlKey)
                    ) {
                      handleSubmit()
                    }
                  }}
                  placeholder={t('recently.editor.placeholder')}
                  ref={textareaRef}
                  required
                  value={content}
                />
                {error ? (
                  <span className="text-xs text-red-500">{error}</span>
                ) : null}
              </label>

              {detectedUrls.length > 0 ? (
                <div className="mt-4 grid gap-2">
                  {detectedUrls.map((url) => {
                    const state = previewStates[url]

                    return (
                      <div className="grid gap-1.5" key={url}>
                        <div className="flex min-w-0 items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="shrink-0">
                            {t('recently.editor.urlDetected')}
                          </span>
                          <code className="truncate rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-neutral-900">
                            {url}
                          </code>
                          {state?.loading ? (
                            <Loader2
                              aria-hidden="true"
                              className="size-3 shrink-0 animate-spin"
                            />
                          ) : null}
                        </div>

                        {state?.result ? (
                          <EnrichmentInlineCard
                            enrichment={state.result}
                            url={url}
                          />
                        ) : null}

                        {state?.error && !state.loading ? (
                          <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                            <div className="font-medium text-neutral-700 dark:text-neutral-300">
                              {t('recently.editor.unidentifiedUrl')}
                            </div>
                            <div className="mt-0.5">
                              {cleanErrorMessage(state.error, t)}
                            </div>
                            <div className="mt-1 text-neutral-400">
                              {t('recently.editor.canSaveAnyway')}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <span className="mr-auto text-xs text-neutral-400">
                {t('recently.editor.shortcut')}
              </span>
              <Dialog.Close
                className="inline-flex h-9 items-center justify-center rounded border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
                type="button"
              >
                {t('common.cancel')}
              </Dialog.Close>
              <Button disabled={mutation.isPending} type="submit">
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
