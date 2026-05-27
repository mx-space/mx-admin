import { Dialog } from '@base-ui/react/dialog'
import { Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { toast } from 'sonner'

import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'

import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'

import '@xterm/xterm/css/xterm.css'

export interface TerminalOutputDialogProps {
  onClose: () => void
  onFinish?: () => void
  open: boolean
  title: string
  url: string | null
}

export function TerminalOutputDialog({
  onClose,
  onFinish,
  open,
  title,
  url,
}: TerminalOutputDialogProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!open || !url || !containerRef.current) return

    setConnecting(true)
    setRunning(true)

    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: true,
      fontFamily:
        'JetBrains Mono, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
      fontSize: 12,
      lineHeight: 1.35,
      theme: {
        background: '#020617',
        foreground: '#e5e7eb',
        selectionBackground: '#334155',
      },
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(containerRef.current)
    fitAddon.fit()
    terminal.focus()
    terminal.writeln(`$ ${url}`)
    terminal.writeln('')
    terminalRef.current = terminal
    fitAddonRef.current = fitAddon
    setConnecting(false)

    const resizeObserver = new ResizeObserver(() => fitAddon.fit())
    resizeObserver.observe(containerRef.current)

    const eventSource = new EventSourcePolyfill(url, {
      withCredentials: true,
    })

    eventSource.onmessage = (event) => {
      terminal.write(event.data)
    }
    eventSource.onerror = (event) => {
      const errorEvent = event as unknown as { data?: string }
      eventSource.close()
      setRunning(false)

      if (errorEvent.data) {
        terminal.writeln('')
        terminal.writeln(errorEvent.data)
        toast.error(errorEvent.data)
        return
      }

      terminal.writeln('')
      terminal.writeln('Done.')
      onFinish?.()
    }

    return () => {
      resizeObserver.disconnect()
      eventSource.close()
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
      setConnecting(false)
      setRunning(false)
    }
  }, [onFinish, open, url])

  return (
    <Dialog.Root
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      open={open}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-black/45" />
        <Dialog.Popup className="outline-hidden fixed left-1/2 top-1/2 z-[61] flex h-[min(82vh,42rem)] w-[min(92vw,48rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            <Dialog.Title className="min-w-0 truncate text-sm font-semibold text-neutral-950 dark:text-neutral-50">
              {title}
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {connecting || running ? (
                <span className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {connecting ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-3 animate-spin"
                    />
                  ) : null}
                  {connecting
                    ? t('snippets.dialog.terminal.connecting')
                    : t('snippets.dialog.terminal.running')}
                </span>
              ) : null}
              <Dialog.Close className="inline-flex size-8 items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-neutral-100">
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>
          </div>
          <div
            className={cn(
              'min-h-0 flex-1 bg-slate-950 p-2',
              connecting && 'grid place-items-center',
            )}
          >
            {connecting ? (
              <span className="text-xs text-neutral-400">
                {t('snippets.dialog.terminal.preparing')}
              </span>
            ) : null}
            <div
              aria-label={t('snippets.dialog.terminal.outputAria')}
              className={cn('h-full w-full', connecting && 'hidden')}
              ref={containerRef}
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
