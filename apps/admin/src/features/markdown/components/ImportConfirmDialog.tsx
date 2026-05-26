import { Dialog } from '@base-ui/react/dialog'
import { AlertCircle } from 'lucide-react'

import { Button } from '~/ui/primitives/button'

import { ImportType } from '../types/markdown'

export function ImportConfirmDialog(props: {
  importing: boolean
  importType: ImportType
  itemCount: number
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) props.onClose()
      }}
      open
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
            <Dialog.Title className="text-sm font-semibold">
              确认导入
            </Dialog.Title>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-amber-500"
              />
              <div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  即将导入{' '}
                  <strong className="tabular-nums">{props.itemCount}</strong>{' '}
                  条数据到{' '}
                  <span className="rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs dark:border-neutral-800 dark:bg-neutral-900">
                    {props.importType === ImportType.Post ? '博文' : '日记'}
                  </span>
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  此操作会创建新的内容，请确认数据无误。
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={props.onClose} type="button" variant="subtle">
                取消
              </Button>
              <Button
                disabled={props.importing}
                onClick={props.onConfirm}
                type="button"
              >
                确认导入
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
