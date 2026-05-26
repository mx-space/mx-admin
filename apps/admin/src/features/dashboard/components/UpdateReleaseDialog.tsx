import { Dialog } from '@base-ui/react/dialog'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, X } from 'lucide-react'
import type { ReleaseModalState } from '../types/dashboard'

import { getReleaseDetails } from '~/api/github-update'
import { Button } from '~/ui/button'
import { MarkdownRender } from '~/ui/markdown-render'
import { Scroll } from '~/ui/scroll'

import { dashboardQueryKeys } from '../constants'
import { formatDateTime } from '../utils/dashboard'

export function UpdateReleaseDialog(props: {
  onClose: () => void
  release: ReleaseModalState | null
}) {
  const releaseQuery = useQuery({
    enabled: Boolean(props.release),
    queryFn: () => {
      if (!props.release) throw new Error('Missing release')
      return getReleaseDetails(props.release.repo, props.release.version)
    },
    queryKey: [
      ...dashboardQueryKeys.releaseDetail,
      props.release?.repo,
      props.release?.version,
    ],
    retry: false,
  })
  const details = releaseQuery.data

  return (
    <Dialog.Root
      onOpenChange={(open) => !open && props.onClose()}
      open={Boolean(props.release)}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 flex max-h-[min(86vh,42rem)] w-[min(92vw,40rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <Dialog.Title className="min-w-0 truncate text-base font-semibold text-neutral-950 dark:text-neutral-50">
              {props.release?.title || '更新详情'}
            </Dialog.Title>
            <Dialog.Close className="inline-flex size-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-neutral-100">
              <X aria-hidden="true" className="size-4" />
            </Dialog.Close>
          </div>
          <Scroll className="min-h-0 flex-1" innerClassName="p-4">
            {releaseQuery.isLoading ? (
              <div className="py-10 text-center text-sm text-neutral-500">
                正在获取更新详情...
              </div>
            ) : details ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                      {details.name || details.tagName}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <span className="rounded border border-neutral-200 px-2 py-0.5 dark:border-neutral-800">
                        {details.tagName}
                      </span>
                      <span>
                        发布于 {formatDateTime(details.publishedAt || '')}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => window.open(details.htmlUrl, '_blank')}
                    type="button"
                    variant="subtle"
                  >
                    <ExternalLink aria-hidden="true" className="size-4" />在
                    GitHub 查看
                  </Button>
                </div>
                {details.body ? (
                  <MarkdownRender
                    className="rounded border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
                    text={details.body}
                  />
                ) : (
                  <div className="py-8 text-center text-sm text-neutral-500">
                    此版本没有发布说明。
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-neutral-500">
                无法获取更新详情
              </div>
            )}
          </Scroll>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
