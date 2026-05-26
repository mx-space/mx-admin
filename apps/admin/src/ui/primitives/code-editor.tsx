import Editor, { loader } from '@monaco-editor/react'
import { AlertCircle, CheckCircle2, Code2, Loader2, Save } from 'lucide-react'
import { useMemo } from 'react'
import * as monaco from 'monaco-editor'
import type { OnMount } from '@monaco-editor/react'

import { cn } from '~/utils/cn'

loader.config({ monaco })

export interface CodeEditorProps {
  className?: string
  dirty?: boolean
  language: string
  onChange: (value: string) => void
  onSave?: () => void
  saving?: boolean
  title?: string
  value: string
}

export function CodeEditor({
  className,
  dirty,
  language,
  onChange,
  onSave,
  saving,
  title,
  value,
}: CodeEditorProps) {
  const lineCount = useMemo(
    () => (value ? value.split('\n').length : 1),
    [value],
  )

  const handleMount: OnMount = (editor, monacoInstance) => {
    if (!onSave) return

    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
      () => onSave(),
    )
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-neutral-950 text-neutral-100',
        className,
      )}
    >
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-neutral-800 px-4 text-xs text-neutral-400">
        <div className="flex min-w-0 items-center gap-2">
          <Code2 aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate font-medium uppercase">
            {title ?? language}
          </span>
          {onSave ? (
            <span className="hidden text-neutral-600 sm:inline">
              Cmd/Ctrl+S
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span>{lineCount} lines</span>
          {saving ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 aria-hidden="true" className="size-3 animate-spin" />
              Saving
            </span>
          ) : dirty === undefined ? null : dirty ? (
            <span className="inline-flex items-center gap-1">
              <AlertCircle aria-hidden="true" className="size-3" />
              Modified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 aria-hidden="true" className="size-3" />
              Saved
            </span>
          )}
          {onSave ? (
            <button
              aria-label="保存"
              className="inline-flex size-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
              onClick={onSave}
              type="button"
            >
              <Save aria-hidden="true" className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          loading={
            <div className="flex h-full items-center justify-center text-xs text-neutral-500">
              Monaco 体积较大，正在加载...
            </div>
          }
          onChange={(nextValue) => onChange(nextValue ?? '')}
          onMount={handleMount}
          options={{
            automaticLayout: true,
            contextmenu: true,
            fontFamily:
              'JetBrains Mono, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
            fontSize: 12,
            lineHeight: 20,
            minimap: { enabled: false },
            padding: { bottom: 16, top: 16 },
            scrollBeyondLastLine: false,
            tabSize: 2,
            wordWrap: 'on',
          }}
          theme="vs-dark"
          value={value}
        />
      </div>
    </div>
  )
}
