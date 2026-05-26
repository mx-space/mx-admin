import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { toast } from 'sonner'

import { API_URL } from '~/constants/env'
import { Scroll } from '~/ui/scroll'

export function DashboardUpgradeDialog(props: {
  onClose: () => void
  open: boolean
}) {
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const outputRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!props.open) return

    setOutput('')
    setRunning(true)

    const source = new EventSourcePolyfill(
      `${API_URL}/update/upgrade/dashboard`,
      {
        withCredentials: true,
      },
    )

    source.onmessage = (event) => {
      setOutput((value) => `${value}${event.data}\n`)
    }
    source.onerror = (event) => {
      const errorEvent = event as unknown as { data?: string }
      source.close()
      setRunning(false)

      if (errorEvent.data) {
        toast.error(errorEvent.data)
        return
      }

      setOutput((value) => `${value}\nDone.\n`)
      window.setTimeout(() => {
        window.location.reload()
      }, 1500)
    }

    return () => {
      source.close()
      setRunning(false)
    }
  }, [props.open])

  useEffect(() => {
    const element = outputRef.current
    if (!element) return

    element.scrollTop = element.scrollHeight
  }, [output])

  return (
    <Dialog.Root
      onOpenChange={(open) => !open && props.onClose()}
      open={props.open}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-50 flex h-[min(82vh,42rem)] w-[min(92vw,46rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <Dialog.Title className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
              面板更新输出
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {running ? (
                <span className="text-xs text-neutral-500">运行中...</span>
              ) : null}
              <Dialog.Close className="inline-flex size-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-neutral-100">
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>
          </div>
          <Scroll
            className="min-h-0 flex-1 bg-neutral-950"
            innerClassName="p-4"
            ref={outputRef}
          >
            <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-5 text-neutral-100">
              {output || '正在连接更新服务...'}
            </pre>
          </Scroll>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
